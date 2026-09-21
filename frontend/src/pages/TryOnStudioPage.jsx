import { useEffect, useState, useRef } from "react";
import { getCatalogProduct, listCatalogProducts, submitProductFeedback } from "../api/catalogApi.js";
import { createCatalogTryOnTask, createCustomTryOnTask, createTryOnTask } from "../api/tryonApi.js";
import { getUserMe, getUserToken, setUserToken } from "../api/userApi.js";
import { AppShell, Button, SelectField, TextField, TopNav, formatMoney, ProductPurchaseActions } from "../components/ui/index.jsx";
import { useLanguage } from "../i18n.jsx";
import { useTryOn } from "../contexts/TryOnContext.jsx";

export default function TryOnStudioPage() {
  const { t } = useLanguage();
  const { currentTask, startTask: startGlobalTask } = useTryOn();
  const params = new URLSearchParams(window.location.search);
  const initialProductId = params.get("productId") || "";
  
  const [user, setUser] = useState(null);
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  
  const [customTryOnType, setCustomTryOnType] = useState("dress");
  const [dressFile, setDressFile] = useState(null);
  const [upperFile, setUpperFile] = useState(null);
  const [lowerFile, setLowerFile] = useState(null);
  const [dressPreview, setDressPreview] = useState("");
  const [upperPreview, setUpperPreview] = useState("");
  const [lowerPreview, setLowerPreview] = useState("");
  
  const [modelFile, setModelFile] = useState(null);
  const [modelPreview, setModelPreview] = useState("");
  
  const [resultUrl, setResultUrl] = useState("");
  const [completedTryOnProductId, setCompletedTryOnProductId] = useState("");
  
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  
  const [feedbackForm, setFeedbackForm] = useState({ rating: "5", fitFeedback: "true_to_size", comment: "" });
  const [feedbackNotice, setFeedbackNotice] = useState("");

  const [previewState, setPreviewState] = useState("original"); // "original" | "result"
  const [garmentSource, setGarmentSource] = useState("marketplace"); // "marketplace" | "upload"

  const modelInputRef = useRef(null);
  const dressInputRef = useRef(null);
  const upperInputRef = useRef(null);
  const lowerInputRef = useRef(null);

  useEffect(() => {
    if (!getUserToken()) return;
    getUserMe()
      .then((response) => {
        setUser(response.user);
        setModelPreview(response.user.profile?.modelImageUrl || "");
      })
      .catch(() => {
        setUserToken("");
        setUser(null);
      });
  }, []);

  useEffect(() => {
    if (initialProductId) {
      loadProduct(initialProductId);
    } else {
      listCatalogProducts({ limit: 10 }).then((response) => {
        setRelatedProducts(response.products || []);
      }).catch(() => {});
    }
  }, [initialProductId]);

  useEffect(() => {
    if (currentTask) {
      if (currentTask.product && !product) {
        setProduct(currentTask.product);
        setGarmentSource("marketplace");
      }
      
      if (currentTask.status === "completed") {
        if (currentTask.resultUrl) {
          setStatus("completed");
          setResultUrl(currentTask.resultUrl);
          setCompletedTryOnProductId(currentTask.product?.id || "");
          setMessage("");
          setPreviewState("result");
        } else {
          setStatus("error");
          setMessage("Tạo ảnh hoàn tất nhưng không tìm thấy kết quả từ AI.");
          setPreviewState("original");
        }
      } else if (currentTask.status === "failed") {
        setStatus("error");
        setMessage(currentTask.errorMessage);
        setPreviewState("original");
      } else {
        setStatus("processing");
        setMessage("MIROIR is creating your virtual try-on in the background...");
        setPreviewState("original");
      }
    }
  }, [currentTask, product]);

  const loadProduct = async (productId) => {
    setMessage("");
    setDressFile(null); setDressPreview("");
    setUpperFile(null); setUpperPreview("");
    setLowerFile(null); setLowerPreview("");
    
    try {
      const response = await getCatalogProduct(productId);
      setProduct(response.product);
      setGarmentSource("marketplace");
      setResultUrl("");
      setCompletedTryOnProductId("");
      setFeedbackNotice("");
      setPreviewState("original");
      
      const related = await listCatalogProducts({ category: response.product.category, shopId: response.product.shopId, limit: 11 });
      setRelatedProducts((related.products || []).filter((item) => item.id !== productId));
      window.history.replaceState(null, "", `/app/try-on?productId=${productId}`);
    } catch (e) {
      console.error(e);
    }
  };

  const setGarmentFile = (field, file) => {
    const preview = file ? URL.createObjectURL(file) : "";
    if (field === "dress") {
      setDressFile(file);
      setDressPreview(preview);
      if (file) {
        setUpperFile(null); setLowerFile(null);
        setUpperPreview(""); setLowerPreview("");
      }
    }
    if (field === "upper") {
      setUpperFile(file);
      setUpperPreview(preview);
      if (file) {
        setDressFile(null); setDressPreview("");
      }
    }
    if (field === "lower") {
      setLowerFile(file);
      setLowerPreview(preview);
      if (file) {
        setDressFile(null); setDressPreview("");
      }
    }
  };

  const onModelFile = (event) => {
    const file = event.target.files?.[0] || null;
    setModelFile(file);
    if (file) setModelPreview(URL.createObjectURL(file));
  };

  const startTryOn = async () => {
    const isLoggedIn = Boolean(getUserToken());
    const isPlatform = garmentSource === "marketplace";
    const hasCustomUploads = Boolean(dressFile || upperFile || lowerFile);

    if (isPlatform && !product) return setMessage("Vui lòng chọn một sản phẩm từ marketplace.");
    if (!isPlatform && !hasCustomUploads) return setMessage("Vui lòng tải lên ảnh trang phục.");
    if (isPlatform && !isLoggedIn) return setMessage("Vui lòng đăng nhập để thử sản phẩm marketplace.");
    if (!isPlatform && !isLoggedIn && !modelFile) return setMessage("Vui lòng tải ảnh của bạn lên trước.");

    setStatus("loading");
    setMessage("");
    setResultUrl("");
    setCompletedTryOnProductId("");
    setFeedbackNotice("");
    setPreviewState("original");

    try {
      let response;
      if (isPlatform) {
        response = await createCatalogTryOnTask({ productId: product.id, modelImage: modelFile });
      } else if (isLoggedIn) {
        response = await createCustomTryOnTask({ tryOnType: customTryOnType, modelImage: modelFile, dressImage: dressFile, upperImage: upperFile, lowerImage: lowerFile });
      } else {
        const formData = new FormData();
        formData.append("tryOnType", customTryOnType);
        formData.append("batchSize", "1");
        if (modelFile) formData.append("modelImage", modelFile);
        if (dressFile) formData.append("dressImage", dressFile);
        if (upperFile) formData.append("upperImage", upperFile);
        if (lowerFile) formData.append("lowerImage", lowerFile);
        response = await createTryOnTask(formData);
      }
      
      startGlobalTask(response.taskId, isPlatform ? product : null, customTryOnType);
    } catch (error) {
      setStatus("error");
      setMessage(error.response?.data?.message || "Không thể bắt đầu thử đồ.");
    }
  };

  const logout = () => {
    setUserToken("");
    window.location.href = "/";
  };

  const glassPanelClass = "bg-white/45 backdrop-blur-[24px] border border-white/70 rounded-[28px] p-5 shadow-[0_20px_60px_rgba(80,110,70,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] flex flex-col relative overflow-hidden group";

  return (
    <AppShell nav={<TopNav user={user} onLogout={logout} />}>
      <main 
        className="min-h-[calc(100vh-80px)] py-6 sm:py-8 px-4 sm:px-6 lg:px-8 relative overflow-x-hidden flex flex-col"
        style={{
          backgroundImage: "url('/liquid-bg-clean.png')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
          backgroundColor: "#F8FAF7"
        }}
      >
        {/* Subtle radial fade to reduce background intensity behind the center stage */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.7)_0%,rgba(255,255,255,0.1)_70%,transparent_100%)] pointer-events-none z-0" />

        <div className="relative z-10 max-w-[1600px] w-full mx-auto flex flex-col flex-1">
          
          {/* HERO TITLE */}
          <div className="text-center mb-6 sm:mb-8 shrink-0">
            <p className="text-[11px] font-black text-[#91B76F] uppercase tracking-[0.25em] mb-2">Studio AI</p>
            <h1 className="text-3xl md:text-5xl font-extrabold text-[#101512] tracking-tight font-display mb-2.5">
              Thử đồ cùng AI
            </h1>
            <p className="text-[13px] md:text-[15px] text-gray-500 font-medium max-w-md mx-auto">
              Tải ảnh, chọn sản phẩm và khám phá phong cách phù hợp nhất với bạn.
            </p>
          </div>

          {/* MAIN LAYOUT */}
          <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 xl:gap-8 items-stretch justify-center flex-1 min-h-0">
            
            {/* LEFT PALETTE (Floating Tools) */}
            <aside className="w-full lg:w-[260px] xl:w-[280px] shrink-0 order-2 lg:order-1 flex flex-col gap-4">
              <div className={glassPanelClass}>
                <div className="absolute inset-[1px] rounded-[inherit] pointer-events-none bg-gradient-to-br from-white/60 to-transparent z-0" />
                
                <div className="relative z-10">
                  <h2 className="text-[15px] font-extrabold text-[#101512] mb-4">Tải ảnh của bạn</h2>
                  
                  {/* Upload Square */}
                  <div 
                    onClick={() => modelInputRef.current?.click()}
                    className="aspect-square relative rounded-[20px] border-2 border-dashed border-[#91B76F]/30 bg-white/50 hover:bg-white/80 transition-all duration-300 flex flex-col items-center justify-center overflow-hidden cursor-pointer shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] group-hover:border-[#91B76F]/60"
                  >
                    {modelPreview ? (
                      <img src={modelPreview} alt="Your photo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-4">
                        <svg className="w-7 h-7 mx-auto text-[#91B76F] mb-3 transition-transform group-hover:-translate-y-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        <span className="text-[12px] font-bold text-gray-400 block leading-relaxed">Kéo thả ảnh vào đây<br/>hoặc nhấn để tải ảnh</span>
                      </div>
                    )}
                    <input ref={modelInputRef} type="file" className="hidden" accept="image/*" onChange={onModelFile} />
                  </div>
                  
                </div>
              </div>

              {/* Tips Card */}
              <div className={glassPanelClass + " !p-4"}>
                <div className="absolute inset-[1px] rounded-[inherit] pointer-events-none bg-gradient-to-br from-white/60 to-transparent z-0" />
                <div className="relative z-10 flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#E4F1D7] text-[#91B76F] flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-[13px] font-extrabold text-[#101512] mb-1.5">Mẹo chụp ảnh</h3>
                    <ul className="text-[11px] font-medium text-gray-500 space-y-1 ml-3 list-disc marker:text-[#91B76F]">
                      <li>Đủ ánh sáng, rõ nét</li>
                      <li>Trang phục ôm sát</li>
                      <li>Nhìn thẳng camera</li>
                    </ul>
                  </div>
                </div>
              </div>
            </aside>

            {/* CENTER STAGE (Dominant Hero) */}
            <div className="w-full lg:min-w-[500px] lg:max-w-[700px] lg:flex-1 shrink-0 order-1 lg:order-2 flex flex-col">
              <div className="relative w-full aspect-[3/4] sm:aspect-[4/5] lg:aspect-auto lg:h-full lg:min-h-[640px] bg-white rounded-[32px] sm:rounded-[40px] shadow-[0_24px_80px_rgba(40,60,30,0.06)] border-[6px] sm:border-[8px] border-white/80 overflow-hidden flex flex-col group isolation-isolate">
                
                {/* State Toggle Pill */}
                <div className="absolute top-5 sm:top-6 left-1/2 -translate-x-1/2 z-30 flex bg-white/90 backdrop-blur-md p-1.5 rounded-full border border-gray-100 shadow-sm transition-all duration-300 opacity-95 hover:opacity-100">
                  <button 
                    onClick={() => setPreviewState('original')} 
                    className={`px-5 sm:px-6 py-1.5 sm:py-2 text-[12px] sm:text-[13px] font-bold rounded-full transition-all duration-300 ${previewState === 'original' ? 'bg-[#101512] text-white shadow-md' : 'text-gray-400 hover:text-[#101512]'}`}
                  >
                    Ảnh gốc
                  </button>
                  <button 
                    onClick={() => setPreviewState('result')} 
                    disabled={!resultUrl} 
                    className={`px-5 sm:px-6 py-1.5 sm:py-2 text-[12px] sm:text-[13px] font-bold rounded-full transition-all duration-300 ${previewState === 'result' ? 'bg-[#91B76F] text-white shadow-md' : 'text-gray-400 hover:text-[#101512] disabled:opacity-40 disabled:cursor-not-allowed'}`}
                  >
                    Kết quả AI
                  </button>
                </div>

                {/* Main Render Area */}
                <div className="w-full h-full relative bg-[#F8FAF7]">
                  
                  {/* Original Image */}
                  {modelPreview ? (
                    <img 
                      src={modelPreview}
                      className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-700 ease-in-out ${previewState === 'original' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`} 
                      alt="Original model"
                    />
                  ) : (
                    <div className={`absolute inset-0 w-full h-full flex flex-col items-center justify-center transition-opacity duration-700 ease-in-out bg-white ${previewState === 'original' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                      <div className="text-center text-gray-300">
                        <svg className="w-16 h-16 mx-auto opacity-40 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        <p className="text-[13px] font-bold">Chưa tải ảnh của bạn</p>
                      </div>
                    </div>
                  )}

                  {/* Result Image */}
                  {resultUrl && (
                    <img 
                      src={resultUrl} 
                      className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-700 ease-in-out ${previewState === 'result' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`} 
                      alt="AI Try-On Result"
                    />
                  )}

                  {/* Loading Overlay */}
                  {(status === 'loading' || status === 'processing') && (
                    <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-md flex flex-col items-center justify-center">
                      <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-2 border-[#91B76F]/20 border-t-[#91B76F] animate-spin" />
                        <div className="absolute inset-3 rounded-full border border-white/80 bg-white/70 shadow-[0_4px_12px_rgba(145,183,111,0.2)]" />
                        <div className="relative grid grid-cols-2 gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#101512] animate-pulse" />
                          <span className="h-1.5 w-1.5 rounded-full bg-[#91B76F] animate-pulse" style={{ animationDelay: '150ms' }} />
                          <span className="h-1.5 w-1.5 rounded-full bg-[#91B76F] animate-pulse" style={{ animationDelay: '300ms' }} />
                          <span className="h-1.5 w-1.5 rounded-full bg-[#101512] animate-pulse" style={{ animationDelay: '450ms' }} />
                        </div>
                      </div>
                      <p className="text-[14px] font-extrabold text-[#101512]">Đang tạo kết quả AI...</p>
                      <p className="mt-2 text-[12px] font-medium text-gray-500">Quá trình này có thể mất vài phút.</p>
                    </div>
                  )}

                  {/* Error Overlay */}
                  {status === 'error' && (
                    <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
                      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4 border border-red-100">
                        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-[15px] font-extrabold text-[#101512] mb-2">Không thể tạo ảnh</p>
                      <p className="text-[13px] font-medium text-red-500 max-w-sm">{message}</p>
                      <button onClick={() => setStatus('idle')} className="mt-6 px-6 py-2 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-600 hover:text-[#101512] shadow-sm transition-colors">
                        Đóng
                      </button>
                    </div>
                  )}
                </div>

                {/* Floating Controls at Bottom Right (Only when result is ready) */}
                <div className={`absolute bottom-5 sm:bottom-6 right-5 sm:right-6 z-30 flex flex-col gap-2 sm:gap-3 transition-all duration-500 ${previewState === 'result' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                  <button className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/95 backdrop-blur-sm shadow-lg flex items-center justify-center text-gray-500 hover:text-[#101512] hover:scale-105 transition-all" title="Mở rộng">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                  </button>
                  <button onClick={startTryOn} className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/95 backdrop-blur-sm shadow-lg flex items-center justify-center text-gray-500 hover:text-[#101512] hover:scale-105 transition-all" title="Thử lại">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT PALETTE (Floating Tools) */}
            <aside className="w-full lg:w-[280px] xl:w-[320px] shrink-0 order-3 lg:order-3 flex flex-col gap-4">
              <div className={glassPanelClass + " flex-1 flex flex-col lg:max-h-[calc(100vh-140px)]"}>
                <div className="absolute inset-[1px] rounded-[inherit] pointer-events-none bg-gradient-to-br from-white/60 to-transparent z-0" />
                
                <div className="relative z-10 flex flex-col h-full">
                  <h2 className="text-[15px] font-extrabold text-[#101512] mb-4 shrink-0">Chọn sản phẩm / outfit</h2>
                  
                  {/* Tabs */}
                  <div className="flex bg-white/60 p-1 rounded-full border border-white/80 mb-5 shrink-0 shadow-sm">
                    <button 
                      onClick={() => setGarmentSource('marketplace')} 
                      className={`flex-1 py-1.5 text-[11.5px] font-extrabold rounded-full transition-all duration-300 ${garmentSource === 'marketplace' ? 'bg-[#91B76F] text-white shadow' : 'text-gray-500 hover:text-[#101512]'}`}
                    >
                      Từ Marketplace
                    </button>
                    <button 
                      onClick={() => setGarmentSource('upload')} 
                      className={`flex-1 py-1.5 text-[11.5px] font-extrabold rounded-full transition-all duration-300 ${garmentSource === 'upload' ? 'bg-[#91B76F] text-white shadow' : 'text-gray-500 hover:text-[#101512]'}`}
                    >
                      Tải ảnh
                    </button>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-2">
                    {garmentSource === 'marketplace' ? (
                      <div>
                        {/* Categories (Decorative) */}
                        <div className="flex gap-2.5 overflow-x-auto pb-3 mb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] shrink-0">
                          {['Tất cả', 'Áo', 'Quần', 'Váy/Đầm', 'Áo khoác'].map((cat, i) => (
                            <span key={cat} className={`text-[10px] font-extrabold uppercase tracking-wide px-3.5 py-1.5 rounded-full whitespace-nowrap border transition-colors cursor-pointer ${i === 0 ? 'bg-[#91B76F] text-white border-[#91B76F] shadow-sm' : 'bg-white/50 text-gray-500 border-white hover:bg-white/80'}`}>
                              {cat}
                            </span>
                          ))}
                        </div>

                        {/* Product Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 mt-1">
                          {/* Selected Product */}
                          {product && (
                            <div className="aspect-[3/4] rounded-2xl border-[2.5px] border-[#91B76F] overflow-hidden relative shadow-md cursor-pointer group bg-white">
                              <img src={product.imageUrl} className="w-full h-full object-cover" alt={product.name} />
                              <div className="absolute top-2 right-2 w-5 h-5 bg-[#91B76F] rounded-full flex items-center justify-center text-white shadow-sm">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                              </div>
                            </div>
                          )}
                          {/* Related Products */}
                          {relatedProducts.map(p => (
                            <div key={p.id} onClick={() => loadProduct(p.id)} className="aspect-[3/4] rounded-2xl border-[1.5px] border-white overflow-hidden cursor-pointer hover:border-[#91B76F]/60 hover:shadow-md transition-all bg-white/40 group">
                              <img src={p.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={p.name} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-5">
                        <SelectField value={customTryOnType} onChange={(e) => setCustomTryOnType(e.target.value)}>
                          <option value="dress">Váy / Đầm liền (1 mảnh)</option>
                          <option value="upper_lower">Áo & Quần (2 mảnh)</option>
                        </SelectField>

                        {customTryOnType === 'dress' ? (
                          <div>
                            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Ảnh trang phục</p>
                            <div 
                              onClick={() => dressInputRef.current?.click()}
                              className="block aspect-[3/4] rounded-[20px] border-2 border-dashed border-[#91B76F]/30 bg-white/50 hover:bg-white/80 transition-all cursor-pointer overflow-hidden relative shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] group"
                            >
                              {dressPreview ? (
                                <img src={dressPreview} className="w-full h-full object-cover" />
                              ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                                  <svg className="w-6 h-6 text-[#91B76F] mb-2 transition-transform group-hover:-translate-y-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                  <span className="text-[11px] font-bold text-gray-400">Tải ảnh váy/đầm</span>
                                </div>
                              )}
                              <input ref={dressInputRef} type="file" className="hidden" accept="image/*" onChange={e => setGarmentFile("dress", e.target.files?.[0])} />
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Áo</p>
                              <div 
                                onClick={() => upperInputRef.current?.click()}
                                className="block aspect-[3/4] rounded-[20px] border-2 border-dashed border-[#91B76F]/30 bg-white/50 hover:bg-white/80 transition-all cursor-pointer overflow-hidden relative shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] group"
                              >
                                {upperPreview ? (
                                  <img src={upperPreview} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                                    <svg className="w-5 h-5 text-[#91B76F] mb-1 transition-transform group-hover:-translate-y-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                  </div>
                                )}
                                <input ref={upperInputRef} type="file" className="hidden" accept="image/*" onChange={e => setGarmentFile("upper", e.target.files?.[0])} />
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Quần / Váy</p>
                              <div 
                                onClick={() => lowerInputRef.current?.click()}
                                className="block aspect-[3/4] rounded-[20px] border-2 border-dashed border-[#91B76F]/30 bg-white/50 hover:bg-white/80 transition-all cursor-pointer overflow-hidden relative shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] group"
                              >
                                {lowerPreview ? (
                                  <img src={lowerPreview} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                                    <svg className="w-5 h-5 text-[#91B76F] mb-1 transition-transform group-hover:-translate-y-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                  </div>
                                )}
                                <input ref={lowerInputRef} type="file" className="hidden" accept="image/*" onChange={e => setGarmentFile("lower", e.target.files?.[0])} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Main CTA */}
                  <div className="pt-3 mt-1 shrink-0">
                    <Button 
                      onClick={startTryOn} 
                      disabled={status === 'loading' || status === 'processing'} 
                      className="w-full bg-[#91B76F] hover:bg-[#86AB64] text-white font-extrabold !rounded-full shadow-lg hover:shadow-xl py-4 transition-all text-[14px] flex items-center justify-center gap-2"
                    >
                      ✨ {status === 'loading' || status === 'processing' ? 'Đang tạo kết quả...' : 'Thử đồ ngay'}
                    </Button>
                    {message && <p className={`mt-3 text-[11.5px] text-center font-bold ${status === 'error' ? 'text-red-500' : 'text-gray-500'}`}>{message}</p>}
                  </div>
                </div>
              </div>

              {/* Purchase Action (Appears gracefully after try-on) */}
              {status === 'completed' && resultUrl && garmentSource === 'marketplace' && product && completedTryOnProductId === product.id && (
                <div className={glassPanelClass + " !p-4 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4"}>
                  <div className="absolute inset-[1px] rounded-[inherit] pointer-events-none bg-gradient-to-br from-[#E4F1D7]/60 to-transparent z-0" />
                  <div className="relative z-10 flex flex-col items-center text-center">
                     <p className="text-[13px] font-extrabold text-[#101512] mb-3">Ưng ý với outfit này?</p>
                     <ProductPurchaseActions compact product={product} />
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
