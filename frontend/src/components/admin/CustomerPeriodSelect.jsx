import { useEffect, useId, useRef, useState } from "react";
import { CalendarDays, Check, ChevronDown } from "lucide-react";

export default function CustomerPeriodSelect({ range, month, onChange }) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(0);
  const root = useRef(null);
  const trigger = useRef(null);
  const optionRefs = useRef([]);
  const listId = useId();
  const options = [
    { value: "7d", label: "7 ngày gần nhất", note: "7 ngày, bao gồm hôm nay" },
    { value: "30d", label: "30 ngày gần nhất", note: "30 ngày, bao gồm hôm nay" },
    { value: "90d", label: "90 ngày gần nhất", note: "90 ngày, bao gồm hôm nay" },
    ...(month ? [{ value: "month", label: `Tháng ${month.slice(5)}/${month.slice(0, 4)}`, note: "Tháng đang được chọn" }] : []),
  ];
  const value = month ? "month" : range;
  const selectedIndex = Math.max(0, options.findIndex(option => option.value === value));

  useEffect(() => {
    if (!open) return;
    const outside = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  useEffect(() => { if (open) optionRefs.current[focused]?.focus(); }, [open, focused]);

  const close = () => { setOpen(false); trigger.current?.focus(); };
  const choose = option => { onChange(option.value); close(); };
  const menuKeys = event => {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); }
    else if (event.key === "Tab") setOpen(false);
    else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      setFocused(index => event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length);
    }
  };

  return <div ref={root} className="relative max-w-full">
    <button ref={trigger} type="button" role="combobox" aria-label="Khoảng thời gian thống kê customer" aria-haspopup="listbox" aria-controls={open ? listId : undefined} aria-expanded={open} onClick={() => { setFocused(selectedIndex); setOpen(previous => !previous); }} onKeyDown={event => { if (["ArrowDown", "ArrowUp"].includes(event.key)) { event.preventDefault(); setFocused(selectedIndex); setOpen(true); } }} className={`inline-flex min-h-12 min-w-[228px] max-w-full items-center gap-3 rounded-2xl border bg-white px-3 py-2 text-left shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[#9DB880] focus-visible:ring-offset-2 ${open ? "border-[#9DB880] bg-[#FBFDF8]" : "border-[#DCE4D6] hover:border-[#A7BC92] hover:bg-[#FBFDF8]"}`}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F0F5E8] text-[#6A884F]"><CalendarDays size={17} /></span>
      <span className="min-w-0 flex-1 text-sm font-semibold text-[#344B32]">{options[selectedIndex].label}</span>
      <ChevronDown size={16} className={`shrink-0 text-[#7C8B71] transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
    {open && <div className="absolute left-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-3rem)] rounded-[22px] border border-[#DCE6D2] bg-white p-2 shadow-[0_16px_48px_rgba(45,67,35,0.14)]">
      <p className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8B9A7D]">Khoảng thời gian</p>
      <div id={listId} role="listbox" aria-label="Khoảng thời gian thống kê customer" onKeyDown={menuKeys} className="space-y-1">
        {options.map((option, index) => <button type="button" role="option" aria-selected={value === option.value} id={`${listId}-${option.value}`} key={option.value} ref={element => { optionRefs.current[index] = element; }} tabIndex={-1} onFocus={() => setFocused(index)} onClick={() => choose(option)} className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#A0B985] ${value === option.value ? "bg-[#EDF4E3] text-[#344B32]" : "text-[#526155] hover:bg-[#F6F8F1] focus:bg-[#F6F8F1]"}`}>
          <span><span className="block text-sm font-semibold">{option.label}</span><span className="mt-0.5 block text-[11px] text-[#819075]">{option.note}</span></span>
          {value === option.value && <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#66894B] text-white"><Check size={13} strokeWidth={3} /></span>}
        </button>)}
      </div>
    </div>}
  </div>;
}
