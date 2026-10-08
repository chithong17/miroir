import { useState, useEffect } from "react";
import axios from "axios";
import { Loader2 } from "lucide-react";

const buttonBase =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:opacity-50 disabled:cursor-not-allowed";
const fieldClass =
  "w-full rounded-xl border border-line bg-white px-3 py-3 text-sm font-medium outline-none transition focus:border-mintDeep focus:ring-4 focus:ring-mintDeep/10";
const labelClass = "text-sm font-bold text-slate-900";

export default function ShopShippingSettings() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  // GHN Configuration form state
  const [ghnConfig, setGhnConfig] = useState({
    is_active: false,
    credentials: { api_token: "" }
  });
  const [ghtkConfig, setGhtkConfig] = useState({
    is_active: false,
    credentials: { api_token: "" }
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("miroir_shop_owner_token");
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
      const { data } = await axios.get(`${API_BASE}/shipping-configs/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConfigs(data.data || []);
      
      const ghn = data.data?.find((c) => c.provider === "GHN");
      if (ghn) {
        setGhnConfig({
          is_active: ghn.is_active,
          credentials: { 
            api_token: ghn.credentials?.api_token || "",
            client_id: ghn.credentials?.client_id || ""
          }
        });
      }
      const ghtk = data.data?.find((c) => c.provider === "GHTK");
      if (ghtk) {
        setGhtkConfig({
          is_active: ghtk.is_active,
          credentials: { api_token: ghtk.credentials?.api_token || "" }
        });
      }
    } catch (error) {
      console.error(error);
      setNotice("Không thể tải cấu hình vận chuyển.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGHN = async () => {
    try {
      setSaving(true);
      setNotice("");
      const token = localStorage.getItem("miroir_shop_owner_token");
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
      await axios.put(
        `${API_BASE}/shipping-configs/me/GHN`,
        {
          is_active: ghnConfig.is_active,
          environment: "SANDBOX",
          credentials: { 
            api_token: ghnConfig.credentials.api_token,
            client_id: ghnConfig.credentials.client_id
          }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotice("Lưu cấu hình Giao Hàng Nhanh thành công!");
      fetchConfigs(); // Refresh to mask token again
    } catch (error) {
      console.error(error);
      setNotice("Đã có lỗi xảy ra khi lưu cấu hình.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGHTK = async () => {
    try {
      setSaving(true);
      setNotice("");
      const token = localStorage.getItem("miroir_shop_owner_token");
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
      await axios.put(
        `${API_BASE}/shipping-configs/me/GHTK`,
        {
          is_active: ghtkConfig.is_active,
          environment: "SANDBOX",
          credentials: { api_token: ghtkConfig.credentials.api_token }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotice("Lưu cấu hình Giao Hàng Tiết Kiệm thành công!");
      fetchConfigs(); // Refresh to mask token again
    } catch (error) {
      console.error(error);
      setNotice("Đã có lỗi xảy ra khi lưu cấu hình.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="grid gap-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-ink">Cấu hình Đơn vị vận chuyển</h1>
        <p className="mt-2 text-sm text-muted">
          Quản lý các hãng vận chuyển bạn muốn dùng để giao hàng cho khách. Hiện tại hệ thống đang hỗ trợ môi trường Sandbox (thử nghiệm) để tránh phát sinh chi phí thật.
        </p>
      </div>

      {notice && (
        <div className="rounded-xl bg-accentSoft p-4 text-sm font-bold text-mintDeep">
          {notice}
        </div>
      )}

      {/* GHN Card */}
      <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F06A3B]/10">
              <span className="font-black text-[#F06A3B]">GHN</span>
            </div>
            <div>
              <h2 className="text-lg font-black">Giao Hàng Nhanh (Sandbox)</h2>
              <p className="text-sm text-muted">API thử nghiệm - Không tạo đơn thực tế</p>
            </div>
          </div>
          
          {/* Toggle Switch */}
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={ghnConfig.is_active}
              onChange={(e) => setGhnConfig({ ...ghnConfig, is_active: e.target.checked })}
            />
            <div className="peer h-7 w-12 rounded-full bg-slate-200 after:absolute after:left-[4px] after:top-[4px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-mintDeep peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
          </label>
        </div>

        {ghnConfig.is_active && (
          <div className="grid gap-4 border-t border-slate-100 pt-6">
            <label className="grid gap-2">
              <span className={labelClass}>GHN Sandbox API Token (Dev)</span>
              <input
                className={fieldClass}
                type="text"
                placeholder="Nhập API Token lấy từ dev.ghn.vn"
                value={ghnConfig.credentials.api_token}
                onChange={(e) => setGhnConfig({
                  ...ghnConfig,
                  credentials: { ...ghnConfig.credentials, api_token: e.target.value }
                })}
              />
              <p className="text-xs text-muted">Bảo mật: Token sẽ bị ẩn khi tải lại trang.</p>
            </label>

            <label className="grid gap-2 mt-2">
              <span className={labelClass}>GHN Shop ID (Bắt buộc)</span>
              <input
                className={fieldClass}
                type="text"
                placeholder="Nhập Shop ID (ví dụ: 191312) từ dev.ghn.vn"
                value={ghnConfig.credentials.client_id || ""}
                onChange={(e) => setGhnConfig({
                  ...ghnConfig,
                  credentials: { ...ghnConfig.credentials, client_id: e.target.value }
                })}
              />
              <p className="text-xs text-muted">Bắt buộc để tính phí và tạo đơn hàng trên GHN.</p>
            </label>

            {/* In a complete version, Address Selection would go here */}
            
            <div className="mt-2 flex justify-end">
              <button 
                className={`${buttonBase} bg-ink text-white hover:bg-ink/90`}
                onClick={handleSaveGHN}
                disabled={saving}
              >
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        )}
      </section>
      
      {/* GHTK Card */}
      <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00894F]/10">
              <span className="font-black text-[#00894F]">GHTK</span>
            </div>
            <div>
              <h2 className="text-lg font-black">Giao Hàng Tiết Kiệm (Sandbox)</h2>
              <p className="text-sm text-muted">API thử nghiệm - Không tạo đơn thực tế</p>
            </div>
          </div>
          
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={ghtkConfig.is_active}
              onChange={(e) => setGhtkConfig({ ...ghtkConfig, is_active: e.target.checked })}
            />
            <div className="peer h-7 w-12 rounded-full bg-slate-200 after:absolute after:left-[4px] after:top-[4px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-mintDeep peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
          </label>
        </div>

        {ghtkConfig.is_active && (
          <div className="grid gap-4 border-t border-slate-100 pt-6">
            <label className="grid gap-2">
              <span className={labelClass}>GHTK Sandbox API Token (Dev)</span>
              <input
                className={fieldClass}
                type="text"
                placeholder="Nhập API Token lấy từ services-staging.ghtklab.com"
                value={ghtkConfig.credentials.api_token}
                onChange={(e) => setGhtkConfig({
                  ...ghtkConfig,
                  credentials: { ...ghtkConfig.credentials, api_token: e.target.value }
                })}
              />
              <p className="text-xs text-muted">Bảo mật: Token sẽ bị ẩn khi tải lại trang.</p>
            </label>
            
            <div className="mt-2 flex justify-end">
              <button 
                className={`${buttonBase} bg-ink text-white hover:bg-ink/90`}
                onClick={handleSaveGHTK}
                disabled={saving}
              >
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
