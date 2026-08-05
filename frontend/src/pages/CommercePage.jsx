import { useEffect, useMemo, useState } from "react";
import {
  cancelMyOrder, checkoutCart, createAddress, deleteAddress, getCart, getMyOrder,
  listAddresses, listMyOrders, listProvinces, listWards, removeCartItem,
  previewBuyNow, reportMyTransfer, selectCartAddress, setDefaultAddress, updateAddress, updateCartItem,
  createRefundDispute,
  listMyDisputes, replyMyDispute,
} from "../api/commerceApi.js";
import { getUserMe, setUserToken } from "../api/userApi.js";
import { AppShell, Button, EmptyState, PageHeader, SelectField, StatusBadge, TextField, TopNav, formatMoney } from "../components/ui/index.jsx";

const blankAddress = { label: "Nhà riêng", recipientName: "", phone: "", provinceCode: "", wardCode: "", addressLine: "", note: "" };
const orderLabels = { pending_confirmation: "Chờ xác nhận", confirmed: "Đã xác nhận", preparing: "Đang chuẩn bị", shipping: "Đang giao", delivered: "Đã giao", cancel_requested: "Yêu cầu hủy", cancelled: "Đã hủy", expired: "Hết hạn" };
const paymentLabels = { cod_pending: "Tiền mặt – chưa thu", awaiting_transfer: "Chờ chuyển khoản", pending_verification: "Chờ shop đối soát", paid: "Đã thanh toán", refund_pending: "Chờ hoàn tiền", refunded: "Đã hoàn tiền" };

const copy = async (value) => navigator.clipboard.writeText(value);
const displayedCode = (value = "") => value.length === 22 ? `${value.slice(0, 3)} ${value.slice(3, 9)} ${value.slice(9, 18)} ${value.slice(18)}` : value;

export default function CommercePage({ mode, orderId }) {
  const [user, setUser] = useState(null);
  useEffect(() => {
    getUserMe().then((result) => setUser(result.user)).catch(() => { setUserToken(""); window.location.href = "/login"; });
  }, []);
  return (
    <AppShell nav={<TopNav user={user} onLogout={() => { setUserToken(""); window.location.href = "/"; }} />}>
      <main className="section-shell py-8">
        {mode === "cart" ? <CartView /> : null}
        {mode === "checkout" ? <CheckoutView /> : null}
        {mode === "addresses" ? <AddressBook /> : null}
        {mode === "orders" ? <OrdersView /> : null}
        {mode === "order" ? <OrderDetail orderId={orderId} /> : null}
      </main>
    </AppShell>
  );
}

function CartView() {
  const [cart, setCart] = useState(null);
  const [notice, setNotice] = useState("");
  const load = () => getCart().then((result) => setCart(result.cart)).catch((error) => setNotice(error.response?.data?.message || "Không tải được giỏ hàng."));
  useEffect(() => {
    load();
  }, []);
  const change = async (item, quantity) => { try { setCart((await updateCartItem(item.productId, item.variantId, quantity)).cart); window.dispatchEvent(new Event("miroir:cart-updated")); } catch (e) { setNotice(e.response?.data?.message || "Không cập nhật được."); } };
  const remove = async (item) => { setCart((await removeCartItem(item.productId, item.variantId)).cart); window.dispatchEvent(new Event("miroir:cart-updated")); };
  return <>
    <PageHeader eyebrow="MIROIR Commerce" title="Giỏ hàng" description="Sản phẩm được nhóm theo từng shop; checkout sẽ tạo một đơn riêng cho mỗi shop." />
    {notice ? <Notice text={notice} /> : null}
    {!cart?.itemCount ? <div className="mt-6"><EmptyState title="Giỏ hàng đang trống" text="Chọn biến thể sản phẩm và thêm vào giỏ để bắt đầu." /></div> : (
      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-5">{cart.groups.map((group, groupIndex) => <section className="miroir-card" key={group.shop?.id || groupIndex}>
          <h2 className="text-xl font-black">{group.shop?.name || "Không khả dụng"}</h2>
          <div className="mt-4 divide-y divide-line">{group.items.map((item) => <div className="grid gap-3 py-4 sm:grid-cols-[76px_1fr_auto] sm:items-center" key={`${item.productId}-${item.variantId}`}>
            <div className="h-20 w-20 overflow-hidden rounded-xl bg-panel">{item.product?.imageUrl ? <img src={item.product.imageUrl} className="h-full w-full object-cover" alt="" /> : null}</div>
            <div><p className="font-bold">{item.product?.name || "Sản phẩm đã gỡ"}</p><p className="text-sm text-muted">{item.variant?.color || "Mặc định"} · {item.variant?.size || "Một cỡ"} · {item.variant?.sku}</p><p className="mt-1 font-black text-accentStrong">{formatMoney(item.product?.price)}</p>{!item.available ? <p className="text-sm font-bold text-red-600">{item.issue}</p> : null}</div>
            <div className="flex items-center gap-2"><input className="miroir-field !w-20" min="1" max={item.variant?.stockQuantity || 1} type="number" value={item.quantity} onChange={(event) => change(item, Number(event.target.value))} /><Button variant="secondary" onClick={() => remove(item)}>Xóa</Button></div>
          </div>)}</div>
          <p className="text-right font-black">Tạm tính: {formatMoney(group.subtotal)}</p>
        </section>)}</div>
        <aside className="miroir-card h-fit lg:sticky lg:top-28"><p className="text-sm text-muted">Tổng cộng</p><p className="mt-2 text-3xl font-black">{formatMoney(cart.subtotal)}</p><p className="mt-2 text-sm text-muted">Không gồm phí giao hàng. Shop sẽ liên hệ bạn.</p><a className="dark-button mt-5 block text-center" href="/app/checkout">Tiến hành đặt hàng</a></aside>
      </div>
    )}
  </>;
}

function AddressFields({ form, setForm, provinces, wards }) {
  const change = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value, ...(field === "provinceCode" ? { wardCode: "" } : {}) }));
  return <div className="grid gap-3 sm:grid-cols-2">
    <TextField label="Nhãn" value={form.label} onChange={change("label")} />
    <TextField label="Tên người nhận" required value={form.recipientName} onChange={change("recipientName")} />
    <TextField label="Số điện thoại" required value={form.phone} onChange={change("phone")} />
    <SelectField label="Tỉnh/Thành phố" required value={form.provinceCode} onChange={change("provinceCode")}><option value="">Chọn tỉnh/thành</option>{provinces.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</SelectField>
    <SelectField label="Xã/Phường" required value={form.wardCode} onChange={change("wardCode")}><option value="">Chọn xã/phường</option>{wards.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</SelectField>
    <TextField label="Địa chỉ chi tiết" wide required value={form.addressLine} onChange={change("addressLine")} />
  </div>;
}

function useLocations(form) {
  const [provinces, setProvinces] = useState([]); const [wards, setWards] = useState([]); const [version, setVersion] = useState("");
  useEffect(() => { listProvinces().then((result) => { setProvinces(result.provinces); setVersion(result.datasetVersion); }); }, []);
  useEffect(() => { if (form.provinceCode) listWards(form.provinceCode).then((result) => setWards(result.wards)); else setWards([]); }, [form.provinceCode]);
  return { provinces, wards, version };
}

function AddressBook() {
  const [addresses, setAddresses] = useState([]); const [form, setForm] = useState(blankAddress); const [editingId, setEditingId] = useState(""); const [notice, setNotice] = useState("");
  const { provinces, wards, version } = useLocations(form);
  const load = () => listAddresses()
    .then((result) => setAddresses(result.addresses || []))
    .catch((error) => setNotice(error.response?.data?.message || "Không tải được sổ địa chỉ."));
  useEffect(() => {
    load();
  }, []);
  const save = async (event) => { event.preventDefault(); try { if (editingId) await updateAddress(editingId, form); else await createAddress(form); setForm(blankAddress); setEditingId(""); setNotice("Đã lưu địa chỉ."); load(); } catch (e) { setNotice(e.response?.data?.message || "Không lưu được địa chỉ."); } };
  return <><PageHeader eyebrow="Tài khoản" title="Sổ địa chỉ" description={`Danh mục hành chính ${version || "đang tải"}. Bạn có thể lưu nhiều người nhận.`} />
    {notice ? <Notice text={notice} /> : null}
    <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_420px]"><div className="grid gap-4">{addresses.map((item) => <article className="miroir-card" key={item.id}><div className="flex justify-between"><div><p className="font-black">{item.label} {item.isDefault ? <span className="text-sm text-accentStrong">· Mặc định</span> : null}</p><p className="mt-2 font-bold">{item.recipientName} · {item.phone}</p><p className="text-sm text-muted">{item.fullAddress}</p></div></div><div className="mt-4 flex gap-2">{!item.isDefault ? <Button variant="secondary" onClick={async () => { await setDefaultAddress(item.id); load(); }}>Đặt mặc định</Button> : null}<Button variant="secondary" onClick={() => { setEditingId(item.id); setForm({ label: item.label, recipientName: item.recipientName, phone: item.phone, provinceCode: item.provinceCode, wardCode: item.wardCode, addressLine: item.addressLine }); }}>Sửa</Button><Button variant="secondary" onClick={async () => { try { await deleteAddress(item.id); load(); } catch (e) { setNotice(e.response?.data?.message); } }}>Xóa</Button></div></article>)}</div>
      <form className="miroir-card h-fit" onSubmit={save}><h2 className="mb-4 text-xl font-black">{editingId ? "Sửa địa chỉ" : "Thêm địa chỉ"}</h2><AddressFields {...{ form, setForm, provinces, wards }} /><Button className="mt-4 w-full" type="submit">Lưu địa chỉ</Button>{editingId ? <Button variant="secondary" className="mt-2 w-full" onClick={() => { setEditingId(""); setForm(blankAddress); }}>Hủy sửa</Button> : null}</form></div></>;
}

function CheckoutView() {
  const isBuyNow = new URLSearchParams(window.location.search).get("mode") === "buy-now";
  const [buyNowItems] = useState(() => {
    if (!isBuyNow) return null;
    try {
      const value = JSON.parse(sessionStorage.getItem("miroir_buy_now") || "null");
      return Array.isArray(value) && value.length ? value : null;
    } catch {
      return null;
    }
  });
  const [cart, setCart] = useState(null); const [addresses, setAddresses] = useState([]); const [selected, setSelected] = useState(""); const [manual, setManual] = useState(false); const [form, setForm] = useState(blankAddress); const [savedAddressNote, setSavedAddressNote] = useState(""); const [saveAddress, setSaveAddress] = useState(false); const [setAsDefault, setSetAsDefault] = useState(false); const [methods, setMethods] = useState({}); const [notice, setNotice] = useState(""); const [busy, setBusy] = useState(false);
  const { provinces, wards, version } = useLocations(form);
  useEffect(() => {
    if (isBuyNow && !buyNowItems) {
      setNotice("Phiên mua ngay không hợp lệ. Vui lòng chọn lại sản phẩm và biến thể.");
      return;
    }
    const cartRequest = isBuyNow ? previewBuyNow(buyNowItems) : getCart();
    Promise.all([cartRequest, listAddresses()])
      .then(([cartResult, addressResult]) => {
        setCart(cartResult.cart);
        setAddresses(addressResult.addresses || []);
        const defaultAddress = (addressResult.addresses || []).find((item) => item.isDefault);
        setSelected(defaultAddress?.id || addressResult.addresses?.[0]?.id || "");
        setMethods(Object.fromEntries((cartResult.cart?.groups || []).filter((group) => group.shop).map((group) => [group.shop.id, "cash"])));
      })
      .catch((error) => setNotice(error.response?.data?.message || "Không tải được thông tin thanh toán."));
  }, []);
  useEffect(() => { if (selected) selectCartAddress(selected).catch(() => {}); }, [selected]);
  const submit = async () => { setBusy(true); setNotice(""); try { const payload = { idempotencyKey: crypto.randomUUID(), paymentMethods: methods, ...(buyNowItems ? { buyNowItems } : {}), ...(manual ? { recipient: form, saveAddress, setAsDefault } : { addressId: selected, note: savedAddressNote }) }; const result = await checkoutCart(payload); if (buyNowItems) sessionStorage.removeItem("miroir_buy_now"); sessionStorage.setItem("miroir_checkout_orders", JSON.stringify(result.orders)); window.dispatchEvent(new Event("miroir:cart-updated")); window.location.href = `/app/orders/${result.orders[0].id}?checkout=success`; } catch (e) { setNotice(e.response?.data?.message || "Không thể tạo đơn."); setBusy(false); } };
  return <><PageHeader eyebrow={isBuyNow ? "Mua ngay" : "Checkout"} title="Thông tin đặt hàng" description={isBuyNow ? "Đơn hàng chỉ gồm sản phẩm vừa chọn; các sản phẩm khác trong giỏ được giữ nguyên." : "Địa chỉ được snapshot vào từng đơn; phương thức thanh toán chọn riêng theo shop."} />{notice ? <Notice text={notice} /> : null}
    <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_380px]"><div className="grid gap-5"><section className="miroir-card"><div className="flex items-center justify-between"><h2 className="text-xl font-black">Người nhận</h2><Button variant="secondary" onClick={() => setManual(!manual)}>{manual ? "Chọn địa chỉ đã lưu" : "Nhập địa chỉ mới"}</Button></div>{manual ? <div className="mt-4"><AddressFields {...{ form, setForm, provinces, wards }} /><TextField className="mt-3" label="Ghi chú" value={form.note} onChange={(e) => setForm((v) => ({ ...v, note: e.target.value }))} /><label className="mt-4 flex gap-2"><input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} /> Lưu vào sổ địa chỉ</label>{saveAddress ? <label className="mt-2 flex gap-2"><input type="checkbox" checked={setAsDefault} onChange={(e) => setSetAsDefault(e.target.checked)} /> Đặt làm mặc định</label> : null}<p className="mt-2 text-xs text-muted">Dataset {version}</p></div> : <div className="mt-4 grid gap-3">{addresses.map((item) => <label key={item.id} className={`rounded-xl border p-4 ${selected === item.id ? "border-accentStrong bg-accentSoft" : "border-line bg-white"}`}><input className="mr-2" type="radio" checked={selected === item.id} onChange={() => setSelected(item.id)} /> <strong>{item.recipientName}</strong> · {item.phone}<p className="ml-6 text-sm text-muted">{item.fullAddress}</p></label>)}<TextField label="Ghi chú cho đơn hàng" value={savedAddressNote} onChange={(event) => setSavedAddressNote(event.target.value)} /></div>}</section>
      {cart?.groups.map((group) => <section className="miroir-card" key={group.shop?.id}><h2 className="font-black">{group.shop?.name}</h2><p className="mt-1 text-sm text-muted">{group.items.length} sản phẩm · {formatMoney(group.subtotal)}</p><div className="mt-4 flex gap-3"><label className="flex-1 rounded-xl border border-line p-3"><input type="radio" className="mr-2" checked={methods[group.shop?.id] === "cash"} onChange={() => setMethods((m) => ({ ...m, [group.shop.id]: "cash" }))} /> Tiền mặt</label><label className={`flex-1 rounded-xl border border-line p-3 ${group.shop?.bankTransferAvailable ? "" : "cursor-not-allowed opacity-50"}`}><input type="radio" disabled={!group.shop?.bankTransferAvailable} className="mr-2" checked={methods[group.shop?.id] === "bank_transfer"} onChange={() => setMethods((m) => ({ ...m, [group.shop.id]: "bank_transfer" }))} /> Chuyển khoản{!group.shop?.bankTransferAvailable ? <span className="block text-xs">Shop chưa cấu hình</span> : null}</label></div></section>)}</div>
      <aside className="miroir-card h-fit"><p className="text-sm text-muted">Tổng thanh toán</p><p className="mt-2 text-3xl font-black">{formatMoney(cart?.subtotal || 0)}</p><p className="mt-2 text-sm text-muted">Phí giao hàng: trao đổi trực tiếp với shop.</p><Button className="mt-5 w-full" disabled={busy || (!manual && !selected)} onClick={submit}>{busy ? "Đang tạo đơn..." : "Đặt hàng"}</Button></aside></div></>;
}

function OrdersView() {
  const [orders, setOrders] = useState([]); useEffect(() => { listMyOrders().then((result) => setOrders(result.orders)); }, []);
  return <><PageHeader eyebrow="Commerce" title="Đơn hàng của tôi" description="Theo dõi trạng thái đơn, thanh toán và hoàn tiền." /><div className="mt-6 grid gap-4">{orders.length ? orders.map((order) => <a href={`/app/orders/${order.id}`} key={order.id} className="miroir-card grid gap-3 transition hover:-translate-y-0.5 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="font-mono text-lg font-black">{displayedCode(order.orderCode)}</p><p className="mt-1 text-sm text-muted">{order.shopSnapshot?.name} · {new Date(order.createdAt).toLocaleString("vi-VN")}</p><div className="mt-3 flex gap-2"><StatusBadge status={orderLabels[order.orderStatus]} /><StatusBadge status={paymentLabels[order.paymentStatus]} /></div></div><p className="text-xl font-black">{formatMoney(order.total)}</p></a>) : <EmptyState title="Chưa có đơn hàng" text="Đơn sau checkout sẽ xuất hiện tại đây." />}</div></>;
}

function OrderDetail({ orderId }) {
  const [order, setOrder] = useState(null); const [dispute, setDispute] = useState(null); const [notice, setNotice] = useState(""); const [proof, setProof] = useState(null);
  const load = () => Promise.all([getMyOrder(orderId), listMyDisputes()]).then(([result, disputeResult]) => { setOrder(result.order); setDispute((disputeResult.disputes || []).find((item) => item.orderId === orderId) || null); }).catch((e) => setNotice(e.response?.data?.message || "Không tải được đơn."));
  useEffect(() => {
    load();
  }, [orderId]);
  if (!order) return <Notice text={notice || "Đang tải đơn hàng..."} />;
  const canCancel = !["delivered", "cancelled", "expired"].includes(order.orderStatus);
  const canDispute = order.paymentStatus === "refunded" || (order.paymentStatus === "refund_pending" && Date.now() - new Date(order.refundPendingAt || order.updatedAt).getTime() >= 72 * 60 * 60 * 1000);
  const transfer = order.paymentMethod === "bank_transfer" ? order.paymentSnapshot : null;
  const checkoutOrders = new URLSearchParams(window.location.search).get("checkout") === "success" ? JSON.parse(sessionStorage.getItem("miroir_checkout_orders") || "[]") : [];
  return <>{checkoutOrders.length ? <section className="mb-6 rounded-2xl border border-accentStrong bg-accentSoft p-5"><h2 className="text-xl font-black">Đặt hàng thành công</h2><p className="mt-1 text-sm text-muted">Một đơn đã được tạo cho mỗi shop. Sao chép đúng mã liền khi chuyển khoản.</p><div className="mt-4 grid gap-2">{checkoutOrders.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3"><a className="font-mono font-black hover:underline" href={`/app/orders/${item.id}`}>{displayedCode(item.orderCode)}</a><div className="flex items-center gap-2"><span className="font-bold">{formatMoney(item.total)}</span><Button variant="secondary" onClick={() => copy(item.orderCode)}>Sao chép</Button></div></div>)}</div></section> : null}<PageHeader eyebrow="Chi tiết đơn" title={displayedCode(order.orderCode)} action={<Button variant="secondary" onClick={() => copy(order.orderCode)}>Sao chép mã</Button>} />{notice ? <Notice text={notice} /> : null}
    <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_380px]"><div className="grid gap-5"><section className="miroir-card"><div className="flex flex-wrap gap-2"><StatusBadge status={orderLabels[order.orderStatus]} /><StatusBadge status={paymentLabels[order.paymentStatus]} /></div><h2 className="mt-5 text-xl font-black">Sản phẩm</h2>{order.items.map((item) => <div className="mt-4 flex gap-4 border-t border-line pt-4" key={item.variantId}><div className="h-20 w-20 overflow-hidden rounded-xl bg-panel">{item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : null}</div><div><p className="font-bold">{item.name}</p><p className="text-sm text-muted">{item.color || "Mặc định"} · {item.size || "Một cỡ"} · {item.sku} · x{item.quantity}</p><p className="font-black">{formatMoney(item.lineTotal)}</p></div></div>)}</section>
      <section className="miroir-card"><h2 className="text-xl font-black">Người nhận</h2><p className="mt-3 font-bold">{order.recipient.name} · {order.recipient.phone}</p><p className="text-sm text-muted">{order.recipient.fullAddress}</p>{order.recipient.note ? <p className="mt-2 text-sm">Ghi chú: {order.recipient.note}</p> : null}</section>
      <section className="miroir-card"><h2 className="text-xl font-black">Timeline</h2><ol className="mt-4 border-l-2 border-accentSoft pl-5">{order.statusHistory.map((item, index) => <li className="relative mb-5" key={`${item.createdAt}-${index}`}><span className="absolute -left-[26px] top-1 h-3 w-3 rounded-full bg-accentStrong" /><p className="font-bold">{orderLabels[item.status] || item.status}</p><p className="text-xs text-muted">{new Date(item.createdAt).toLocaleString("vi-VN")} {item.note ? `· ${item.note}` : ""}</p></li>)}</ol></section>{dispute ? <section className="miroir-card"><h2 className="text-xl font-black">Khiếu nại hoàn tiền · {dispute.status}</h2><div className="mt-4 grid gap-2">{dispute.messages.map((item) => <div className="rounded-xl bg-panel p-3" key={item.id}><p className="text-xs font-bold uppercase text-muted">{item.actorType}</p><p>{item.message}</p></div>)}</div>{!["resolved", "closed"].includes(dispute.status) ? <Button variant="secondary" className="mt-3" onClick={async () => { const message = window.prompt("Nội dung phản hồi:"); if (message) { await replyMyDispute(dispute.id, message); load(); } }}>Phản hồi</Button> : null}</section> : null}</div>
      <aside className="grid h-fit gap-5">{transfer ? <section className="miroir-card"><h2 className="text-xl font-black">Chuyển khoản</h2><img src={transfer.qrImageUrl} alt="QR chuyển khoản" className="mx-auto mt-4 max-h-64 rounded-xl" /><CopyRow label={transfer.bankName} value={transfer.accountNumber} /><CopyRow label="Chủ tài khoản" value={transfer.accountHolder} /><CopyRow label="Số tiền" value={String(order.total)} display={formatMoney(order.total)} /><CopyRow label="Nội dung" value={order.transferContent} display={displayedCode(order.transferContent)} />{["awaiting_transfer", "pending_verification"].includes(order.paymentStatus) ? <><input className="miroir-field mt-4" type="file" accept="image/*" onChange={(e) => setProof(e.target.files?.[0])} /><Button className="mt-3 w-full" onClick={async () => { try { await reportMyTransfer(order.id, proof); setNotice("Đã báo shop kiểm tra chuyển khoản."); load(); } catch (e) { setNotice(e.response?.data?.message); } }}>Tôi đã chuyển khoản</Button></> : null}</section> : null}
      <section className="miroir-card"><p className="text-sm text-muted">Tổng thanh toán</p><p className="text-3xl font-black">{formatMoney(order.total)}</p>{canCancel ? <Button variant="secondary" className="mt-5 w-full" onClick={async () => { const reason = window.prompt("Lý do hủy/yêu cầu hủy:") || ""; try { await cancelMyOrder(order.id, reason); load(); } catch (e) { setNotice(e.response?.data?.message); } }}>Hủy / yêu cầu hủy</Button> : null}{canDispute ? <Button variant="secondary" className="mt-3 w-full" onClick={async () => { const message = window.prompt("Mô tả việc chưa nhận được tiền hoàn:"); if (!message) return; try { await createRefundDispute(order.id, message); setNotice("Đã gửi khiếu nại đến shop và admin."); } catch (e) { setNotice(e.response?.data?.message); } }}>Khiếu nại chưa nhận hoàn tiền</Button> : null}</section></aside></div></>;
}

function CopyRow({ label, value, display }) { return <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-panel p-3"><div><p className="text-xs text-muted">{label}</p><p className="break-all font-mono font-bold">{display || value}</p></div><Button variant="secondary" onClick={() => copy(value)}>Copy</Button></div>; }
function Notice({ text }) { return <p className="mt-5 rounded-xl border border-line bg-accentSoft p-4 text-sm font-semibold">{text}</p>; }
