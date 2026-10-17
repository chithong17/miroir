import { useEffect, useState } from 'react';
import './PublicInfoPage.css';
import heroStageBackground from '../assets/hero2-stage-no-model.png';

const email = 'miroirofficial20@gmail.com';
export const PUBLIC_INFO_PATHS = ['/about', '/policies', '/privacy', '/ai-policy', '/terms', '/delete-account', '/support'];
const links = [
  ['/about', 'Về MIROIR'], ['/privacy', 'Bảo mật'], ['/ai-policy', 'AI Try-on'],
  ['/terms', 'Điều khoản'], ['/delete-account', 'Xóa tài khoản'], ['/support', 'Hỗ trợ'],
];
const documents = {
  '/privacy': {
    title: 'Dữ liệu của bạn. Quyền lựa chọn của bạn.', label: 'Chính sách bảo mật',
    intro: 'Thông tin về dữ liệu được sử dụng khi bạn khám phá thời trang, thử đồ và mua sắm trên MIROIR.',
    sections: [
      ['Dữ liệu MIROIR xử lý', 'Thông tin tài khoản như tên, email và thông tin xác thực; hồ sơ phong cách và số đo bạn cung cấp; ảnh người mẫu, ảnh trang phục và kết quả thử đồ; sản phẩm yêu thích, giỏ hàng, địa chỉ giao hàng, đơn hàng, tin nhắn và ảnh đính kèm. Dữ liệu cụ thể phụ thuộc tính năng bạn sử dụng.'],
      ['Mục đích sử dụng', 'Đăng nhập và quản lý tài khoản; cá nhân hóa gợi ý trang phục; tạo kết quả AI Try-on; xử lý mua sắm, giao nhận và đổi trả; kết nối người mua với shop; vận hành, xử lý sự cố và bảo vệ dịch vụ. Không gửi mật khẩu, mã OTP hoặc thông tin thẻ thanh toán qua tin nhắn hỗ trợ.'],
      ['Những bên tham gia xử lý', 'Ảnh có thể được lưu qua Cloudinary và được gửi tới PiAPI để xử lý thử đồ. Dữ liệu tài khoản và nghiệp vụ được lưu trong cơ sở dữ liệu MongoDB của dịch vụ. Shop nhận thông tin cần thiết để xử lý đơn hàng và hội thoại với bạn; thanh toán gói shop được xử lý qua PayOS. Đây là các thành phần được nhận diện trong mã nguồn hiện tại, không phải tuyên bố về mọi nhà thầu hoặc vị trí lưu trữ.'],
      ['Lưu trữ và xóa dữ liệu', 'MIROIR chưa công bố một thời hạn lưu trữ cố định áp dụng cho mọi loại dữ liệu. Không có cam kết mọi ảnh tự động biến mất sau 24 giờ. Xóa tài khoản hiện xóa bản ghi tài khoản, địa chỉ, giỏ hàng và các bản ghi tác vụ Try-on gắn với tài khoản theo chức năng backend; không đồng nghĩa xóa ngay mọi ảnh trên dịch vụ lưu trữ/AI, bản sao lưu, đơn hàng hoặc tin nhắn. Xem phạm vi và yêu cầu xử lý bổ sung tại trang Xóa tài khoản.'],
      ['Lựa chọn và yêu cầu của bạn', 'Bạn có thể cập nhật hồ sơ trong ứng dụng, ngừng tải ảnh, xóa tài khoản hoặc liên hệ MIROIR để yêu cầu kiểm tra, chỉnh sửa hay xóa dữ liệu cụ thể. Chúng tôi cần xác minh quyền sở hữu trước khi xử lý yêu cầu liên quan đến dữ liệu cá nhân. Không gửi ảnh nhạy cảm nếu không cần thiết.'],
      ['Lưu trữ trên thiết bị', 'Website sử dụng bộ nhớ trình duyệt cho trạng thái đăng nhập và tùy chọn giao diện. Xóa dữ liệu trình duyệt có thể đăng xuất bạn nhưng không xóa tài khoản trên máy chủ. Truy cập dịch vụ trên thiết bị đáng tin cậy và đăng xuất sau khi dùng máy dùng chung.'],
      ['Liên hệ và cập nhật', `Gửi yêu cầu về dữ liệu tới ${email}. Nội dung chính sách cần được cập nhật khi tính năng, nhà cung cấp hoặc cách xử lý dữ liệu thay đổi.`],
    ],
  },
  '/ai-policy': {
    title: 'Thử phong cách mới. Hiểu cách AI hoạt động.', label: 'Chính sách AI Try-on',
    intro: 'Trước khi tải ảnh, hãy hiểu dữ liệu nào được xử lý và giới hạn của một bản thử đồ được tạo bằng AI.',
    sections: [
      ['Ảnh nào nên tải lên?', 'Chỉ tải ảnh của chính bạn hoặc ảnh mà bạn có quyền sử dụng và được người trong ảnh cho phép. Chọn ảnh rõ, trang phục phù hợp; không tải ảnh khỏa thân, nội dung xâm phạm quyền riêng tư hoặc ảnh giấy tờ định danh. Không sử dụng dịch vụ để giả mạo, quấy rối hoặc tạo nội dung gây hại.'],
      ['Luồng xử lý ảnh', 'Khi bạn chủ động bắt đầu Try-on, ảnh người mẫu và trang phục được tải lên hạ tầng lưu trữ, sau đó URL ảnh được gửi đến nhà cung cấp AI PiAPI để tạo kết quả. Đây không phải xử lý hoàn toàn trên điện thoại. Xem Chính sách bảo mật để biết thêm về các bên tham gia.'],
      ['Kết quả chỉ mang tính minh họa', 'AI có thể làm thay đổi khuôn mặt, vóc dáng, màu sắc, chất liệu hoặc chi tiết trang phục. Kết quả không bảo đảm kích cỡ, độ vừa vặn hay hình dáng thực tế khi mặc. Hãy xem bảng size, mô tả sản phẩm và trao đổi với shop trước khi đặt hàng.'],
      ['Ảnh và thời hạn lưu trữ', 'Không mặc định cho rằng tải ảnh lên đồng nghĩa ảnh được che mặt, không thể nhận diện hoặc tự động xóa sau 24 giờ. Việc xóa bản ghi tác vụ không đồng nghĩa đã xóa file ảnh ở tất cả nhà cung cấp. Nếu cần xóa ảnh đã gửi, liên hệ MIROIR với thông tin tác vụ và thời điểm sử dụng; không gửi lại ảnh nhạy cảm qua email.'],
      ['Khi không muốn tiếp tục', 'Bạn có thể ngừng sử dụng tính năng, không tải thêm ảnh và yêu cầu MIROIR kiểm tra việc xóa dữ liệu. Chúng tôi chưa đưa ra bảo đảm về việc nhà cung cấp không dùng dữ liệu huấn luyện hoặc thời hạn xóa của họ khi chưa xác minh điều khoản tương ứng.'],
    ],
  },
  '/terms': {
    title: 'Rõ ràng từ lần khám phá đầu tiên.', label: 'Điều khoản sử dụng',
    intro: 'Các nguyên tắc sử dụng MIROIR dành cho người khám phá thời trang và các shop tham gia nền tảng.',
    sections: [
      ['Sử dụng dịch vụ', 'MIROIR cung cấp công cụ khám phá sản phẩm, gợi ý trang phục và thử đồ bằng AI. Sử dụng thông tin chính xác khi tạo tài khoản; bảo vệ mật khẩu và chỉ sử dụng ảnh, nội dung mà bạn có quyền cung cấp. Nếu chưa đủ tuổi tự quyết định việc sử dụng dịch vụ, hãy trao đổi với người giám hộ trước khi cung cấp dữ liệu.'],
      ['Tài khoản và nội dung', 'Không giả mạo, xâm nhập tài khoản khác, thu thập trái phép dữ liệu, tải nội dung vi phạm quyền của người khác hoặc lạm dụng hệ thống. Khi cung cấp nội dung, bạn cho phép dịch vụ xử lý nội dung trong phạm vi cần thiết để thực hiện tính năng bạn chọn; việc này không chuyển quyền sở hữu nội dung cho MIROIR.'],
      ['AI và thông tin sản phẩm', 'Gợi ý AI và ảnh thử đồ là công cụ tham khảo, không phải bảo đảm độ vừa vặn hoặc tư vấn chuyên môn. Thông tin giá, tồn kho và sản phẩm có thể thay đổi; kiểm tra nội dung đơn và thông tin shop trước khi xác nhận mua.'],
      ['Đơn hàng, đổi trả và thanh toán', 'Xem phương thức thanh toán, thông tin nhận hàng, điều kiện và trạng thái của từng đơn trước khi xác nhận. Khi có tranh chấp, cung cấp mã đơn và bằng chứng phù hợp qua kênh hỗ trợ. Không có giao dịch nào được xem là đã thanh toán chỉ vì trình duyệt quay lại một URL thành công; trạng thái phải được máy chủ xác nhận.'],
      ['Gói dịch vụ dành cho shop', 'Quyền sử dụng, giá, thời hạn và giới hạn được hiển thị tại thời điểm chọn gói. Người dùng cần kiểm tra thông tin trước khi thanh toán. Không suy diễn rằng mọi tài khoản customer đều có gói trả phí hoặc mọi tính năng được sử dụng không giới hạn.'],
      ['Xóa tài khoản và hỗ trợ', 'Bạn có thể bắt đầu xóa tài khoản từ trang Xóa tài khoản hoặc trong ứng dụng. Việc xóa là không thể hoàn tác đối với dữ liệu đã xóa. Đơn hàng, trao đổi và dữ liệu ở nhà cung cấp cần được xử lý theo phạm vi công bố và yêu cầu cụ thể; không tự động coi mọi nghĩa vụ đang diễn ra là đã kết thúc.'],
      ['Thay đổi và phạm vi tài liệu', 'Tính năng và các tài liệu này có thể được cập nhật. Nội dung hiện là bản mô tả vận hành đang được rà soát trước phát hành chính thức, không phải chứng nhận tuân thủ pháp luật hay chấp thuận của cửa hàng ứng dụng. Khi có câu hỏi, liên hệ MIROIR trước khi tiếp tục sử dụng.'],
    ],
  },
};

function Contact({subject = 'Hỗ trợ MIROIR'}) {
  return <a className="info-button" href={`mailto:${email}?subject=${encodeURIComponent(subject)}`}>Gửi email cho MIROIR <span aria-hidden="true">↗</span></a>;
}

function DeleteAccount() {
  const [fields, setFields] = useState({email: '', password: '', confirmation: ''});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  async function submit(event) {
    event.preventDefault(); setError('');
    if (fields.confirmation !== 'XÓA') {setError('Nhập chính xác XÓA để xác nhận.'); return;}
    setBusy(true);
    try {
      const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
      if (!base) throw new Error('Chưa cấu hình máy chủ cho trang này. Vui lòng gửi yêu cầu qua email bên dưới.');
      // Reauthenticate; keep the deletion token in memory, never browser storage.
      const login = await fetch(`${base}/user-auth/login`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({email: fields.email.trim(), password: fields.password})});
      const auth = await login.json();
      if (!login.ok || !auth.token) throw new Error(auth.message || 'Không thể xác thực tài khoản.');
      const result = await fetch(`${base}/users/me/account`, {method: 'DELETE', headers: {Authorization: `Bearer ${auth.token}`}});
      const data = await result.json();
      if (!result.ok || data.success !== true) throw new Error(data.message || 'Chưa thể xóa tài khoản. Vui lòng liên hệ hỗ trợ.');
      localStorage.removeItem('miroir_user_token');
      setFields({email: '', password: '', confirmation: ''}); setDone(true);
    } catch (e) {setError(e.message || 'Không thể kết nối. Vui lòng thử lại hoặc liên hệ hỗ trợ.');}
    finally {setBusy(false);}
  }
  return <>
    <section className="info-section"><h2>Trước khi bạn quyết định</h2><p>Xóa tài khoản customer MIROIR sẽ xóa bản ghi tài khoản, hồ sơ, địa chỉ, giỏ hàng và bản ghi tác vụ Try-on gắn với tài khoản theo chức năng backend hiện tại. Dữ liệu đã xóa không thể khôi phục bằng cách đăng nhập lại.</p><div className="info-notice"><strong>Phạm vi cần lưu ý</strong><p>Thao tác này chưa tự động xóa đơn hàng, tin nhắn, ảnh/file tại Cloudinary, dữ liệu tại nhà cung cấp AI hoặc bản sao lưu. Để yêu cầu kiểm tra và xử lý dữ liệu còn lại, hãy gửi email cho MIROIR. Chúng tôi chưa công bố thời hạn xử lý cố định cho các yêu cầu đó.</p></div></section>
    <section className="info-section"><h2>Xóa trực tiếp trên website</h2><p>Không cần cài lại ứng dụng. Xác thực bằng tài khoản customer của bạn và xác nhận bên dưới. Tài khoản shop cần liên hệ hỗ trợ để kiểm tra gói dịch vụ và nghiệp vụ đang diễn ra.</p>
      {done ? <div role="status" className="info-notice"><strong>Tài khoản đã được xóa theo phạm vi nêu trên.</strong><p>Để xử lý dữ liệu còn lại ở các hệ thống khác, liên hệ email hỗ trợ.</p></div> : <form className="info-form" onSubmit={submit}>
        <label>Email tài khoản<input type="email" autoComplete="username" required value={fields.email} onChange={e => setFields({...fields,email:e.target.value})} disabled={busy}/></label>
        <label>Mật khẩu<input type="password" autoComplete="current-password" required value={fields.password} onChange={e => setFields({...fields,password:e.target.value})} disabled={busy}/></label>
        <label>Nhập XÓA để xác nhận<input autoComplete="off" required value={fields.confirmation} onChange={e => setFields({...fields,confirmation:e.target.value})} disabled={busy}/></label>
        <p>Nhấn nút bên dưới sẽ thực hiện xóa sau khi xác thực thành công, không phải chỉ gửi yêu cầu.</p>
        {error && <p role="alert" className="info-error">{error}</p>}
        <button className="info-button info-danger" type="submit" disabled={busy}>{busy ? 'Đang xử lý…' : 'Xóa vĩnh viễn tài khoản customer'}</button>
      </form>}
    </section>
    <section className="info-section"><h2>Yêu cầu qua email</h2><p>Nếu không đăng nhập được, cần xóa dữ liệu riêng lẻ hoặc đang dùng tài khoản shop, gửi thư từ email đã đăng ký. Nêu tài khoản, loại dữ liệu muốn xóa và mã đơn/tác vụ nếu có. Không gửi mật khẩu, OTP hoặc ảnh giấy tờ. MIROIR sẽ trao đổi để xác minh trước khi xử lý; việc mở ứng dụng email chưa đồng nghĩa đã gửi yêu cầu.</p><Contact subject="Yêu cầu xóa tài khoản / dữ liệu MIROIR"/></section>
  </>;
}

export default function PublicInfoPage({path}) {
  const doc = documents[path];
  const isAbout = path === '/about';
  const title = doc?.title || (isAbout ? 'Phong cách của bạn, qua một góc nhìn mới.' : path === '/delete-account' ? 'Bạn quyết định khi nào rời đi.' : path === '/support' ? 'MIROIR luôn sẵn sàng lắng nghe.' : 'Khám phá tự tin. Lựa chọn rõ ràng.');
  const label = doc?.label || (isAbout ? 'Về MIROIR' : path === '/delete-account' ? 'Xóa tài khoản & dữ liệu' : path === '/support' ? 'Liên hệ hỗ trợ' : 'Trung tâm thông tin');
  useEffect(() => {
    const previous = document.title; const previousLang = document.documentElement.lang;
    document.title = `${label} | MIROIR`; document.documentElement.lang = 'vi';
    return () => {document.title = previous; document.documentElement.lang = previousLang;};
  }, [label]);
  return <div className="info-site">
    <a href="#info-main" className="info-skip">Đến nội dung chính</a>
    <header className="info-header"><a className="info-logo" href="/" aria-label="MIROIR — Trang chủ"><img src="/logo-web.png" alt=""/>MIROIR</a><nav aria-label="Điều hướng chính"><a href="/">Trang chủ</a><a href="/about" aria-current={isAbout ? 'page' : undefined}>Giới thiệu</a><a href="/policies" aria-current={doc || path === '/policies' || path === '/delete-account' ? 'page' : undefined}>Chính sách</a><a href="/support" aria-current={path === '/support' ? 'page' : undefined}>Hỗ trợ</a></nav><a className="info-open" href="/app">Mở MIROIR <span aria-hidden="true">→</span></a></header>
    <main id="info-main">
      <div className="info-hero" style={{'--info-stage': `url("${heroStageBackground}")`}}><p className="info-eyebrow">MIROIR / {label}</p><h1>{title}</h1><p>{doc?.intro || 'Nơi khám phá thời trang, thử đồ bằng AI và tìm gợi ý cho phong cách riêng — với thông tin dễ tìm, dễ đọc.'}</p><div className="info-hero-meta"><span>FASHION, REIMAGINED.</span><span>THÔNG TIN RÕ RÀNG / TRẢI NGHIỆM AN TÂM</span></div></div>
      <div className="info-layout"><aside><p className="info-eyebrow">THÔNG TIN & QUYỀN LỢI</p><nav aria-label="Các trang thông tin">{links.map(([href,name]) => <a key={href} href={href} aria-current={path === href ? 'page' : undefined}>{name}<span aria-hidden="true">↗</span></a>)}</nav><p className="info-update">Cập nhật: 17.10.2026</p></aside>
        <article className="info-article">
          {doc && <><p className="info-review">Bản nội dung đang rà soát trước phát hành chính thức. Các cam kết phải phù hợp với vận hành thực tế; chưa có tuyên bố chứng nhận tuân thủ.</p><nav className="info-toc" aria-label="Mục lục">{doc.sections.map(([heading],i) => <a key={heading} href={`#section-${i+1}`}>{String(i+1).padStart(2,'0')} / {heading}</a>)}</nav>{doc.sections.map(([heading,body],i) => <section className="info-section" id={`section-${i+1}`} key={heading}><span className="info-number">{String(i+1).padStart(2,'0')}</span><h2>{heading}</h2><p>{body}</p></section>)}<Contact subject={`Câu hỏi về ${label} MIROIR`}/></>}
          {path === '/delete-account' && <DeleteAccount/>}
          {path === '/support' && <><section className="info-section"><h2>Một địa chỉ, cho mọi câu hỏi.</h2><p>Hỗ trợ tài khoản, lỗi Try-on, đơn hàng và yêu cầu về dữ liệu cá nhân.</p><a className="info-email" href={`mailto:${email}`}>{email}</a><p>Gửi email sẽ mở ứng dụng thư trên thiết bị. Chưa có cam kết hỗ trợ 24/7 hoặc thời gian phản hồi cố định.</p><Contact/></section><section className="info-section"><h2>Để được hỗ trợ thuận tiện hơn</h2><ul><li>Tài khoản: gửi email đã đăng ký và mô tả vấn đề, không gửi mật khẩu hoặc OTP.</li><li>Đơn hàng: cung cấp mã đơn, tên shop và nội dung cần hỗ trợ.</li><li>Try-on: cung cấp mã tác vụ, thời điểm và thông báo lỗi; tránh gửi lại ảnh cá nhân nếu chưa cần.</li><li>Dữ liệu: nêu rõ muốn xem, sửa, xóa tài khoản hay xóa ảnh cụ thể.</li></ul></section><section className="info-section"><h2>Câu hỏi thường gặp</h2><details><summary>Ảnh AI có bảo đảm mặc vừa không?</summary><p>Không. Ảnh AI chỉ mang tính minh họa. Kiểm tra bảng size và thông tin shop trước khi mua.</p></details><details><summary>Tôi có thể yêu cầu xóa mà không cài app không?</summary><p>Có. Truy cập <a href="/delete-account">trang xóa tài khoản</a> để xác thực trực tiếp hoặc gửi yêu cầu qua email.</p></details><details><summary>Tôi có nên gửi mật khẩu cho hỗ trợ không?</summary><p>Không. MIROIR không cần mật khẩu hoặc OTP của bạn qua email để tiếp nhận yêu cầu.</p></details></section></>}
          {isAbout && <><section className="info-feature"><div><span className="info-eyebrow">YOUR NEXT LOOK</span><h2>Thử trước một ý tưởng. Tìm thấy một phong cách.</h2><p>Khám phá sản phẩm từ các shop, tải ảnh để xem bản thử đồ AI và mô tả dịp bạn muốn mặc để nhận gợi ý từ Stylist.</p><a className="info-button" href="/app">Khám phá MIROIR ↗</a></div><img src="/discover-1.png" alt="Cảm hứng trang phục trên MIROIR"/></section><section className="info-section"><h2>Từ cảm hứng đến lựa chọn</h2><ol><li><strong>Khám phá.</strong> Xem sản phẩm, giá và thông tin shop.</li><li><strong>Hình dung.</strong> Dùng AI Try-on và Stylist để tham khảo cách phối.</li><li><strong>Quyết định.</strong> Kiểm tra kích cỡ, thông tin đơn và phương thức thanh toán.</li></ol><p>Kết quả AI không thay thế trải nghiệm thử đồ thực tế. Bạn luôn nên kiểm tra thông tin sản phẩm trước khi mua.</p></section><section className="info-section"><h2>Sự rõ ràng cũng là một phần trải nghiệm.</h2><p>Đọc cách ảnh được xử lý, phạm vi xóa tài khoản và cách liên hệ trước khi cung cấp dữ liệu.</p><a className="info-text-link" href="/policies">Đến trung tâm chính sách →</a></section></>}
          {path === '/policies' && <div className="info-directory">{links.filter(([href]) => href !== '/about').map(([href,name],i) => <a href={href} key={href}><span className="info-number">0{i+1}</span><h2>{name}</h2><span aria-hidden="true">↗</span></a>)}</div>}
        </article>
      </div>
    </main>
    <footer className="info-footer"><div className="info-footer-top"><div><span className="info-eyebrow">THE MIROIR MANIFESTO</span><p>Thời trang, qua góc nhìn của bạn.<br/>Khám phá phong cách cùng công nghệ, với sự rõ ràng ở từng lựa chọn.</p></div><nav aria-label="Liên kết chân trang"><span className="info-eyebrow">THÔNG TIN & CHÍNH SÁCH</span>{links.map(([href,name]) => <a key={href} href={href}>{name}</a>)}</nav><div><span className="info-eyebrow">KẾT NỐI VỚI MIROIR</span><a className="info-footer-contact" href={`mailto:${email}`}>{email} ↗</a><a href="/support">Trung tâm hỗ trợ →</a></div></div><div className="info-wordmark" aria-hidden="true">MIROIR</div><div className="info-footer-bottom"><small>© {new Date().getFullYear()} MIROIR</small><span>YOUR STYLE. YOUR REFLECTION.</span><a href="#info-main">Về đầu trang ↑</a></div></footer>
  </div>;
}
