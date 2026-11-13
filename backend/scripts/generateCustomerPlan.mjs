import fs from "fs";
import { getMongoDb, closeMongoConnection } from "../services/mongo.service.js";
import dotenv from "dotenv";

dotenv.config({ path: "backend/.env" });

const realisticCustomersData = [
  { name: "Nguyễn Phương Thảo", email: "thao.nguyenphuong98@gmail.com", phone: "0903841293", gender: "female", height: 162, weight: 50, bust: 84, waist: 64, hips: 90, fitPreference: "true_to_size" },
  { name: "Trần Minh Quân", email: "quan.tranminh2001@gmail.com", phone: "0918273645", gender: "male", height: 174, weight: 68, bust: 92, waist: 76, hips: 94, fitPreference: "relaxed" },
  { name: "Lê Khánh Linh", email: "khanhlinh.le02@gmail.com", phone: "0987162534", gender: "female", height: 165, weight: 52, bust: 86, waist: 66, hips: 92, fitPreference: "true_to_size" },
  { name: "Phạm Thu Hà", email: "thuha.pham97@gmail.com", phone: "0976253412", gender: "female", height: 158, weight: 48, bust: 82, waist: 62, hips: 88, fitPreference: "fitted" },
  { name: "Vũ Bảo Châu", email: "chau.phambao@outlook.com", phone: "0934129876", gender: "female", height: 160, weight: 51, bust: 85, waist: 65, hips: 91, fitPreference: "true_to_size" },
  { name: "Đặng Tiến Đạt", email: "tiendat.dang00@gmail.com", phone: "0909876543", gender: "male", height: 178, weight: 72, bust: 96, waist: 80, hips: 98, fitPreference: "relaxed" },
  { name: "Hoàng Thục Quyên", email: "thucquyen.hoang@gmail.com", phone: "0912345678", gender: "female", height: 163, weight: 53, bust: 86, waist: 67, hips: 93, fitPreference: "true_to_size" },
  { name: "Bùi Diệu Linh", email: "dieulinh.bui99@gmail.com", phone: "0983214567", gender: "female", height: 159, weight: 49, bust: 83, waist: 63, hips: 89, fitPreference: "fitted" },
  { name: "Lê Hoàng Nam", email: "nam.lehoang98@gmail.com", phone: "0978901234", gender: "male", height: 172, weight: 65, bust: 90, waist: 75, hips: 92, fitPreference: "true_to_size" },
  { name: "Đỗ Mai Chi", email: "maichi.do01@gmail.com", phone: "0932145678", gender: "female", height: 166, weight: 54, bust: 88, waist: 68, hips: 94, fitPreference: "relaxed" },
  { name: "Huỳnh Ánh Nguyệt", email: "anhnguyet.huynh96@gmail.com", phone: "0908765432", gender: "female", height: 161, weight: 50, bust: 84, waist: 64, hips: 90, fitPreference: "true_to_size" },
  { name: "Võ Hoàng Yến", email: "hoangyen.vo02@gmail.com", phone: "0919876543", gender: "female", height: 168, weight: 55, bust: 87, waist: 66, hips: 95, fitPreference: "true_to_size" },
  { name: "Trương Tuấn Kiệt", email: "kiet.truongtuan00@gmail.com", phone: "0982345678", gender: "male", height: 176, weight: 70, bust: 94, waist: 78, hips: 96, fitPreference: "relaxed" },
  { name: "Nguyễn Hải Yến", email: "haiyen.nguyen97@gmail.com", phone: "0971234567", gender: "female", height: 157, weight: 47, bust: 81, waist: 61, hips: 87, fitPreference: "fitted" },
  { name: "Phan Kim Ngân", email: "kimngan.phan99@gmail.com", phone: "0936543210", gender: "female", height: 164, weight: 52, bust: 85, waist: 65, hips: 91, fitPreference: "true_to_size" },
  { name: "Trần Cẩm Tú", email: "camtu.tran01@gmail.com", phone: "0904567890", gender: "female", height: 162, weight: 51, bust: 84, waist: 64, hips: 90, fitPreference: "true_to_size" },
  { name: "Bùi Quốc Anh", email: "quocanh.bui98@gmail.com", phone: "0913456789", gender: "male", height: 175, weight: 69, bust: 93, waist: 77, hips: 95, fitPreference: "relaxed" },
  { name: "Lê Ngọc Ánh", email: "ngocanh.le00@gmail.com", phone: "0986543210", gender: "female", height: 160, weight: 49, bust: 83, waist: 63, hips: 89, fitPreference: "fitted" },
  { name: "Phạm Quỳnh Nga", email: "quynhnga.pham02@gmail.com", phone: "0973456789", gender: "female", height: 165, weight: 53, bust: 86, waist: 66, hips: 92, fitPreference: "true_to_size" },
  { name: "Vũ Thùy Chi", email: "thuychi.vu99@gmail.com", phone: "0938765432", gender: "female", height: 158, weight: 48, bust: 82, waist: 62, hips: 88, fitPreference: "fitted" },
  { name: "Đặng Gia Huy", email: "giahuy.dang01@gmail.com", phone: "0906789012", gender: "male", height: 177, weight: 71, bust: 95, waist: 79, hips: 97, fitPreference: "relaxed" },
  { name: "Hoàng Mỹ Duyên", email: "myduyen.hoang98@gmail.com", phone: "0915678901", gender: "female", height: 163, weight: 52, bust: 85, waist: 65, hips: 91, fitPreference: "true_to_size" },
  { name: "Nguyễn Hồng Nhung", email: "hongnhung.nguyen00@gmail.com", phone: "0984567890", gender: "female", height: 161, weight: 50, bust: 84, waist: 64, hips: 90, fitPreference: "true_to_size" },
  { name: "Trịnh Thảo Trang", email: "thaotrang.trinh97@gmail.com", phone: "0975678901", gender: "female", height: 167, weight: 55, bust: 87, waist: 67, hips: 94, fitPreference: "relaxed" },
  { name: "Dương Nhật Minh", email: "nhatminh.duong99@gmail.com", phone: "0935678901", gender: "male", height: 173, weight: 67, bust: 91, waist: 76, hips: 93, fitPreference: "true_to_size" },
  { name: "Lý Thanh Trúc", email: "thanhtruc.ly01@gmail.com", phone: "0907890123", gender: "female", height: 159, weight: 49, bust: 83, waist: 63, hips: 89, fitPreference: "fitted" },
  { name: "Ngô Tố Uyên", email: "touyen.ngo98@gmail.com", phone: "0917890123", gender: "female", height: 164, weight: 53, bust: 86, waist: 66, hips: 92, fitPreference: "true_to_size" },
  { name: "Trần Thảo Vy", email: "thaovy.tran02@gmail.com", phone: "0989012345", gender: "female", height: 160, weight: 50, bust: 84, waist: 64, hips: 90, fitPreference: "true_to_size" },
  { name: "Phạm Hải Đăng", email: "haidang.pham00@gmail.com", phone: "0977890123", gender: "male", height: 179, weight: 73, bust: 97, waist: 81, hips: 99, fitPreference: "relaxed" },
  { name: "Vũ Phương Uyên", email: "phuonguyen.vu99@gmail.com", phone: "0937890123", gender: "female", height: 162, weight: 51, bust: 85, waist: 65, hips: 91, fitPreference: "true_to_size" },
  { name: "Đinh Hoài An", email: "hoaian.dinh01@gmail.com", phone: "0901234567", gender: "female", height: 158, weight: 48, bust: 82, waist: 62, hips: 88, fitPreference: "fitted" },
  { name: "Nguyễn Đức Duy", email: "ducduy.nguyen98@gmail.com", phone: "0914567890", gender: "male", height: 174, weight: 68, bust: 92, waist: 77, hips: 94, fitPreference: "true_to_size" },
  { name: "Trần Bích Ngọc", email: "bichngoc.tran00@gmail.com", phone: "0981234567", gender: "female", height: 165, weight: 52, bust: 86, waist: 65, hips: 92, fitPreference: "true_to_size" },
  { name: "Lê Diệu Hương", email: "dieuhuong.le97@gmail.com", phone: "0972345678", gender: "female", height: 163, weight: 51, bust: 85, waist: 64, hips: 91, fitPreference: "fitted" },
  { name: "Phạm Quốc Bảo", email: "quocbao.pham01@gmail.com", phone: "0931234567", gender: "male", height: 176, weight: 70, bust: 94, waist: 78, hips: 96, fitPreference: "relaxed" },
  { name: "Vũ Khánh An", email: "khanhan.vu02@gmail.com", phone: "0902345678", gender: "female", height: 160, weight: 49, bust: 83, waist: 63, hips: 89, fitPreference: "true_to_size" },
  { name: "Đoàn Thu Trang", email: "thutrang.doan99@gmail.com", phone: "0916789012", gender: "female", height: 166, weight: 54, bust: 87, waist: 67, hips: 93, fitPreference: "relaxed" },
  { name: "Lâm Gia Hân", email: "giahan.lam00@gmail.com", phone: "0985678901", gender: "female", height: 161, weight: 50, bust: 84, waist: 64, hips: 90, fitPreference: "true_to_size" },
  { name: "Nguyễn Quang Khải", email: "quangkhai.nguyen98@gmail.com", phone: "0974567890", gender: "male", height: 175, weight: 69, bust: 93, waist: 78, hips: 95, fitPreference: "true_to_size" },
  { name: "Trần Thùy Dương", email: "thuyduong.tran01@gmail.com", phone: "0939012345", gender: "female", height: 159, weight: 48, bust: 82, waist: 62, hips: 88, fitPreference: "fitted" },
  { name: "Lê Lan Anh", email: "lananh.le97@gmail.com", phone: "0905678901", gender: "female", height: 164, weight: 52, bust: 86, waist: 66, hips: 92, fitPreference: "true_to_size" },
  { name: "Phạm Tuấn Anh", email: "tuananh.pham00@gmail.com", phone: "0911234567", gender: "male", height: 177, weight: 72, bust: 95, waist: 80, hips: 98, fitPreference: "relaxed" },
  { name: "Vũ Bảo Ngọc", email: "baongoc.vu02@gmail.com", phone: "0988901234", gender: "female", height: 162, weight: 51, bust: 85, waist: 65, hips: 91, fitPreference: "true_to_size" },
  { name: "Đào Phương Linh", email: "phuonglinh.dao99@gmail.com", phone: "0979012345", gender: "female", height: 165, weight: 53, bust: 86, waist: 66, hips: 93, fitPreference: "true_to_size" },
  { name: "Bùi Hữu Thắng", email: "huuthang.bui98@gmail.com", phone: "0933456789", gender: "male", height: 172, weight: 66, bust: 91, waist: 76, hips: 93, fitPreference: "true_to_size" },
  { name: "Hồ Diễm Quỳnh", email: "diemquynh.ho01@gmail.com", phone: "0908901234", gender: "female", height: 160, weight: 49, bust: 83, waist: 63, hips: 89, fitPreference: "fitted" },
  { name: "Mai Thu Uyên", email: "thuuyen.mai00@gmail.com", phone: "0919012345", gender: "female", height: 163, weight: 52, bust: 85, waist: 65, hips: 91, fitPreference: "true_to_size" },
  { name: "Nguyễn Trọng Hiếu", email: "tronghieu.nguyen99@gmail.com", phone: "0984321098", gender: "male", height: 178, weight: 73, bust: 96, waist: 80, hips: 98, fitPreference: "relaxed" },
  { name: "Trịnh Kim Oanh", email: "kimoanh.trinh97@gmail.com", phone: "0973210987", gender: "female", height: 158, weight: 48, bust: 82, waist: 62, hips: 88, fitPreference: "fitted" },
  { name: "Lê Minh Châu", email: "minhchau.le02@gmail.com", phone: "0932109876", gender: "female", height: 167, weight: 55, bust: 87, waist: 67, hips: 94, fitPreference: "true_to_size" },
  { name: "Phạm Thúy Hằng", email: "thuyhang.pham98@gmail.com", phone: "0909012345", gender: "female", height: 161, weight: 50, bust: 84, waist: 64, hips: 90, fitPreference: "true_to_size" },
  { name: "Vũ Đình Phong", email: "dinhphong.vu00@gmail.com", phone: "0912109876", gender: "male", height: 174, weight: 68, bust: 92, waist: 77, hips: 94, fitPreference: "true_to_size" },
  { name: "Đỗ Cát Tiên", email: "cattien.do01@gmail.com", phone: "0983210987", gender: "female", height: 164, weight: 52, bust: 86, waist: 65, hips: 92, fitPreference: "true_to_size" },
  { name: "Hoàng Ngọc Trâm", email: "ngoctram.hoang99@gmail.com", phone: "0972109876", gender: "female", height: 159, weight: 49, bust: 83, waist: 63, hips: 89, fitPreference: "fitted" },
  { name: "Nguyễn Thế Anh", email: "theanh.nguyen98@gmail.com", phone: "0931098765", gender: "male", height: 176, weight: 70, bust: 94, waist: 78, hips: 96, fitPreference: "relaxed" },
  { name: "Trần Huyền Trang", email: "huyentrang.tran00@gmail.com", phone: "0907654321", gender: "female", height: 165, weight: 53, bust: 86, waist: 66, hips: 92, fitPreference: "true_to_size" },
  { name: "Lê Nhật Hạ", email: "nhatha.le02@gmail.com", phone: "0918765432", gender: "female", height: 162, weight: 51, bust: 85, waist: 65, hips: 91, fitPreference: "true_to_size" },
  { name: "Phan Bảo Nam", email: "baonam.phan99@gmail.com", phone: "0987654321", gender: "male", height: 175, weight: 69, bust: 93, waist: 78, hips: 95, fitPreference: "true_to_size" },
  { name: "Võ Thảo My", email: "thaomy.vo01@gmail.com", phone: "0976543210", gender: "female", height: 160, weight: 50, bust: 84, waist: 64, hips: 90, fitPreference: "fitted" },
  { name: "Đặng Mỹ Linh", email: "mylinh.dang98@gmail.com", phone: "0936543219", gender: "female", height: 166, weight: 54, bust: 87, waist: 67, hips: 93, fitPreference: "relaxed" },
  { name: "Bùi Thu Thảo", email: "thuthao.bui00@gmail.com", phone: "0905432109", gender: "female", height: 163, weight: 52, bust: 85, waist: 65, hips: 91, fitPreference: "true_to_size" },
  { name: "Dương Minh Trí", email: "minhtri.duong97@gmail.com", phone: "0916543210", gender: "male", height: 177, weight: 71, bust: 95, waist: 79, hips: 97, fitPreference: "relaxed" },
  { name: "Nguyễn Thảo Nhi", email: "thaonhi.nguyen02@gmail.com", phone: "0985432109", gender: "female", height: 158, weight: 48, bust: 82, waist: 62, hips: 88, fitPreference: "fitted" },
  { name: "Trần Anh Thư", email: "anhthu.tran99@gmail.com", phone: "0975432109", gender: "female", height: 164, weight: 53, bust: 86, waist: 66, hips: 92, fitPreference: "true_to_size" },
  { name: "Lê Đình Vũ", email: "dinhvu.le01@gmail.com", phone: "0935432109", gender: "male", height: 173, weight: 67, bust: 91, waist: 76, hips: 93, fitPreference: "true_to_size" },
  { name: "Phạm Như Quỳnh", email: "nhuquynh.pham98@gmail.com", phone: "0904321098", gender: "female", height: 161, weight: 50, bust: 84, waist: 64, hips: 90, fitPreference: "true_to_size" },
  { name: "Vũ Tuyết Mai", email: "tuyetmai.vu00@gmail.com", phone: "0915432109", gender: "female", height: 165, weight: 53, bust: 86, waist: 65, hips: 92, fitPreference: "true_to_size" },
  { name: "Đỗ Minh Đức", email: "minhduc.do99@gmail.com", phone: "0984321097", gender: "male", height: 178, weight: 72, bust: 95, waist: 80, hips: 97, fitPreference: "relaxed" },
  { name: "Hoàng Yến Nhi", email: "yennhi.hoang02@gmail.com", phone: "0974321098", gender: "female", height: 159, weight: 49, bust: 83, waist: 63, hips: 89, fitPreference: "fitted" },
  { name: "Trương Gia Linh", email: "gialinh.truong01@gmail.com", phone: "0934321098", gender: "female", height: 167, weight: 55, bust: 87, waist: 67, hips: 94, fitPreference: "true_to_size" },
  { name: "Nguyễn Văn Đạt", email: "vandat.nguyen98@gmail.com", phone: "0903210987", gender: "male", height: 174, weight: 68, bust: 92, waist: 77, hips: 94, fitPreference: "true_to_size" },
  { name: "Trịnh Thùy Trang", email: "thuytrang.trinh00@gmail.com", phone: "0914321098", gender: "female", height: 162, weight: 51, bust: 85, waist: 65, hips: 91, fitPreference: "true_to_size" },
  { name: "Lê Kiều Oanh", email: "kieuoanh.le97@gmail.com", phone: "0983210986", gender: "female", height: 160, weight: 50, bust: 84, waist: 64, hips: 90, fitPreference: "fitted" },
  { name: "Phạm Tấn Tài", email: "tantai.pham99@gmail.com", phone: "0973210986", gender: "male", height: 176, weight: 70, bust: 94, waist: 78, hips: 96, fitPreference: "relaxed" },
  { name: "Vũ Khánh Linh", email: "khanhlinh.vu01@gmail.com", phone: "0933210987", gender: "female", height: 163, weight: 52, bust: 85, waist: 65, hips: 91, fitPreference: "true_to_size" },
  { name: "Đào Mai Anh", email: "maianh.dao02@gmail.com", phone: "0902109876", gender: "female", height: 166, weight: 54, bust: 87, waist: 66, hips: 93, fitPreference: "true_to_size" }
];

async function generate() {
  const db = await getMongoDb();
  const simUsers = await db.collection("users").find({
    $or: [
      { "simulation.isSimulation": true },
      { email: { $regex: "@example\\.invalid$" } },
      { name: { $regex: "Demo" } }
    ]
  }).sort({ createdAt: 1 }).toArray();

  if (simUsers.length !== realisticCustomersData.length) {
    console.error(`Mismatch: ${simUsers.length} sim users vs ${realisticCustomersData.length} plan customers`);
  }

  const plannedCustomers = simUsers.map((u, i) => {
    const p = realisticCustomersData[i];
    return {
      ordinal: 106 + i,
      id: u.id,
      name: p.name,
      email: p.email,
      phone: p.phone,
      gender: p.gender,
      height: p.height,
      weight: p.weight,
      bust: p.bust,
      waist: p.waist,
      hips: p.hips,
      fitPreference: p.fitPreference,
      profileCompleted: u.profileCompleted,
      status: "active",
      createdAt: u.createdAt
    };
  });

  fs.writeFileSync("backend/scripts/plannedCustomers.json", JSON.stringify(plannedCustomers, null, 2));
  console.log("Successfully generated plannedCustomers.json with", plannedCustomers.length, "customers.");
  await closeMongoConnection();
}

generate().catch(console.error);
