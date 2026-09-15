const money = (value) => `${Number(value || 0).toLocaleString("vi-VN")} ₫`;
const percent = (value) => `${(Number(value || 0) * 100).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`;
const evidence = (id, label, value, source, formula) => ({ id, label, value, source, formula });

// All numbers and conclusions are derived here. AI may rank these complete,
// grounded sections; it cannot introduce new figures, claims or campaigns.
export const buildAdviceReport = (dashboard) => {
  const { summary: s, finance: f, fitFinder: fit } = dashboard;
  const feedback = fit.feedback;
  const paid = s.paidOrders || 0;
  const hasMargin = f.eligibleRevenue > 0 && f.marginRate != null && !f.missingCostItems;
  const price = {
    id: "pricing", category: "Giá & lợi nhuận", priority: "medium",
    status: hasMargin ? "observed" : "insufficient",
    title: hasMargin ? "Đánh giá giá bán từ biên lãi gộp" : "Hoàn thiện cơ sở trước khi điều chỉnh giá",
    evidence: [
      evidence("paid-orders", "Đơn đã thanh toán", `${paid} / ${s.totalOrders} đơn`, "Đơn hàng trong kỳ", "Số đơn có trạng thái đã thanh toán / tổng đơn được tạo trong kỳ."),
      evidence("aov", "Giá trị đơn đã trả tiền TB", paid ? money(s.averageOrderValue) : "Chưa có đơn đã trả tiền", "Đơn hàng trong kỳ", `${money(s.collectedRevenue)} doanh thu đã thu ÷ ${paid} đơn đã thanh toán. Bao gồm phí giao hàng nếu có.`),
      evidence("margin", "Biên lãi gộp", hasMargin ? percent(f.marginRate) : "Chưa đủ dữ liệu", "Đơn đã giao, giá vốn & hoàn tiền", `(${money(f.eligibleRevenue)} doanh thu hàng hóa sau hoàn tiền − ${money(f.knownCost)} giá vốn đã biết) ÷ doanh thu hàng hóa sau hoàn tiền. Chỉ tính khi đủ giá vốn.`),
    ],
    reasoning: hasMargin
      ? `Shop ghi nhận ${money(f.grossProfit)} lãi gộp trên ${money(f.eligibleRevenue)} doanh thu hàng hóa đủ điều kiện. Đây là cơ sở kiểm tra khả năng giảm giá, nhưng chưa chứng minh mức giá hiện tại tối ưu.`
      : `Có ${paid} đơn đã thanh toán và ${f.missingCostItems} đơn vị sản phẩm thiếu giá vốn. Chưa có đủ doanh thu đủ điều kiện hoặc giá vốn để đánh giá biên lãi; không thể kết luận nên tăng hay giảm giá.`,
    actions: hasMargin
      ? ["Đối chiếu giá vốn và lãi gộp theo từng sản phẩm trước khi chọn mặt hàng điều chỉnh giá.", "Nếu thử giá mới, theo dõi lãi gộp và số đơn đã trả tiền của nhóm thử so với nhóm giữ giá trong cùng thời gian."]
      : ["Bổ sung giá vốn tại thời điểm bán và kiểm tra trạng thái giao hàng, thanh toán.", "Thu thập đơn đã giao có đủ giá vốn rồi đánh giá lại trước khi thay đổi giá."],
    limitation: "Lãi gộp chưa trừ quảng cáo, vận hành và các phí khác. Chưa có dữ liệu giá đối thủ hoặc thử nghiệm giá để xác định giá tối ưu.",
    followUp: "Theo dõi lãi gộp, biên lãi và giá trị đơn đã thanh toán trong kỳ tiếp theo.",
  };
  if (hasMargin && f.grossProfit <= 0) {
    price.priority = "high";
    price.title = "Rà soát sản phẩm đang không tạo lãi gộp";
    price.actions.unshift("Kiểm tra các dòng hàng có giá bán thấp hơn hoặc bằng giá vốn; tạm hoãn giảm giá thêm cho đến khi làm rõ.");
  }
  const mismatch = feedback.tooSmall + feedback.tooLarge;
  const size = {
    id: "sizing", category: "Bảng size & độ vừa vặn",
    priority: mismatch || fit.sizeReturnCount ? "high" : "medium",
    status: feedback.total ? "observed" : "insufficient",
    title: mismatch ? "Ưu tiên kiểm tra các phản hồi lệch size" : feedback.total ? "Tiếp tục đối chiếu độ chính xác của bảng size" : "Thu thập phản hồi trước khi sửa bảng size",
    evidence: [
      evidence("fit-feedback", "Phản hồi chật / rộng", `${mismatch} / ${feedback.total} phản hồi`, "Phản hồi size sau giao hàng", `${feedback.tooSmall} phản hồi chật + ${feedback.tooLarge} phản hồi rộng; ${feedback.trueToSize} phản hồi đúng size.${feedback.total ? ` Tỷ trọng lệch size: ${percent(mismatch / feedback.total)}.` : ""}`),
      evidence("size-returns", "Yêu cầu trả do size", `${fit.sizeReturnCount} / ${fit.totalReturns} yêu cầu`, "Yêu cầu trả hàng tạo trong kỳ", "Yêu cầu có lý do size/độ vừa vặn ÷ tất cả yêu cầu trả hàng (gồm cả yêu cầu chưa duyệt). Đây không phải tỷ lệ trên đơn đã bán."),
      evidence("fit-applied", "Lượt áp dụng / mở Fit Finder", `${fit.applied} / ${fit.opened} lượt`, "Sự kiện Fit Finder trong kỳ", "Đếm sự kiện áp dụng size và mở công cụ; chưa ghép theo người dùng hoặc phiên, không coi là tỷ lệ chuyển đổi."),
    ],
    reasoning: feedback.total
      ? `Trong ${feedback.total} phản hồi tự nguyện, có ${mismatch} phản hồi không vừa (${percent(mismatch / feedback.total)}). ${mismatch ? "Đây là tín hiệu để kiểm tra số đo thực tế và hướng dẫn chọn size ở các dòng hàng bị phản ánh." : "Mẫu hiện tại chưa ghi nhận phản hồi chật hoặc rộng, cần tiếp tục theo dõi khi có thêm đơn."}`
      : `Chưa có phản hồi sau giao hàng. ${fit.opened} lượt mở công cụ và ${fit.sizeReturnCount} yêu cầu trả do size chưa đủ để kết luận cần tăng hoặc giảm kích thước bảng size.`,
    actions: mismatch || fit.sizeReturnCount
      ? ["Đối chiếu các phản hồi và yêu cầu trả theo sản phẩm, biến thể, lý do cụ thể.", "Đo lại sản phẩm được phản ánh; bổ sung số đo và mô tả độ ôm/rộng trước khi sửa hướng dẫn chọn size."]
      : ["Mời khách đã nhận hàng phản hồi đúng size, chật hoặc rộng.", "Bổ sung số đo thực tế cho các biến thể còn thiếu và tiếp tục theo dõi phản hồi."],
    limitation: "Phản hồi tự nguyện có thể thiên lệch; lượt dùng công cụ không chứng minh Fit Finder làm giảm trả hàng. Chưa đủ dữ liệu để kết luận một size cụ thể bị lỗi.",
    followUp: "Theo dõi số phản hồi lệch size trên tổng phản hồi và lý do trả hàng sau khi cập nhật.",
  };
  const top = dashboard.topProducts[0];
  const promotion = {
    id: "promotion", category: "Khuyến mãi & bán hàng", priority: "medium", status: "insufficient",
    title: top ? "Chọn sản phẩm thử nghiệm từ doanh số đã thu" : "Tạo đường cơ sở trước khi chạy khuyến mãi",
    evidence: [
      evidence("best-seller", "Sản phẩm dẫn đầu doanh thu", top ? top.name : "Chưa có sản phẩm đã bán", "Dòng hàng trong đơn đã thanh toán", top ? `${top.quantity} sản phẩm, ${top.orderCount} đơn, ${money(top.collectedRevenue)} doanh thu dòng hàng; chưa trừ hoàn tiền từng phần.` : "Loại đơn chưa thanh toán khỏi danh sách bán chạy."),
      evidence("pending-revenue", "Giá trị đơn chờ thanh toán", money(s.projectedRevenue), "Đơn hàng trong kỳ", "Tổng giá trị đơn COD chưa thu, chờ chuyển khoản hoặc chờ xác minh; loại đơn đã hủy/hết hạn. Không phải dự báo doanh thu."),
      evidence("campaign-data", "Dữ liệu hiệu quả chiến dịch", "Chưa được thu thập", "Phạm vi dữ liệu hiện có", "Chưa có mã chiến dịch gắn với đơn, chi phí quảng cáo hoặc nhóm đối chứng để đo hiệu quả khuyến mãi."),
    ],
    reasoning: top
      ? `“${top.name}” dẫn đầu doanh thu dòng hàng đã thanh toán trong kỳ nên có thể được cân nhắc cho thử nghiệm trưng bày hoặc bán kèm. Doanh số này không chứng minh khách nhạy giá hay chương trình khuyến mãi có hiệu quả.`
      : "Chưa có doanh số đã thu theo sản phẩm để chọn mặt hàng thử nghiệm. Tổng đơn và lượt xem riêng lẻ không cho biết khuyến mãi có tạo thêm doanh thu hay không.",
    actions: ["Gắn mã chiến dịch với đơn hàng và ghi nhận mức giảm giá, chi phí quảng cáo.", top ? "Thử một thay đổi nhỏ với sản phẩm dẫn đầu; so sánh số đơn và lãi gộp với nhóm đối chứng cùng thời gian trước khi mở rộng." : "Thu thập đơn đã thanh toán và giá vốn để thiết lập số liệu trước chiến dịch."],
    limitation: "Chưa thể tính hiệu quả đầu tư hoặc đề xuất một mức giảm giá cụ thể. Sản phẩm bán chạy chưa chắc là sản phẩm lãi cao nhất.",
    followUp: "So sánh lãi gộp sau chi phí chiến dịch và số đơn đã thanh toán giữa nhóm thử và nhóm đối chứng.",
  };
  const sections = [price, size, promotion].sort((a, b) => Number(b.priority === "high") - Number(a.priority === "high"));
  return {
    version: 2, range: dashboard.range, shop: dashboard.shop,
    source: "rules", dataQuality: dashboard.dataQuality,
    headline: s.totalOrders ? "Ưu tiên hành động từ dữ liệu của shop" : "Bắt đầu từ việc hoàn thiện dữ liệu",
    summary: `Phân tích ${s.totalOrders} đơn hàng, ${feedback.total} phản hồi size và ${fit.totalReturns} yêu cầu trả hàng trong kỳ. Mỗi nhận định đi kèm nguồn số liệu và giới hạn kết luận.`,
    sections,
  };
};

export const applyAdviceRanking = (report, ranking) => {
  const ids = report.sections.map((section) => section.id);
  if (!Array.isArray(ranking) || ranking.length !== ids.length || new Set(ranking).size !== ids.length || ranking.some((id) => !ids.includes(id))) return report;
  return { ...report, source: "ai_ranked", sections: ranking.map((id) => report.sections.find((section) => section.id === id)) };
};
