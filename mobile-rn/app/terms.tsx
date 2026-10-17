import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import {
  AppHeader,
  Body,
  Card,
  GlassSurface,
  Heading,
  MiroirButton,
  Screen,
  SelectionChip,
} from '../src/components/ui';
import { colors, radii, typography } from '../src/theme/tokens';

export default function TermsAndPrivacy() {
  const [tab, setTab] = useState<'tryon' | 'terms'>('tryon');

  return (
    <Screen
      header={
        <AppHeader
          title="Chính sách & Điều khoản"
          subtitle="Bảo vệ dữ liệu cá nhân & AI Try-On"
          showBack
          onBack={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/');
            }
          }}
        />
      }
    >
      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        <SelectionChip
          label="Chính sách AI Try-On"
          selected={tab === 'tryon'}
          onPress={() => setTab('tryon')}
        />
        <SelectionChip
          label="Điều khoản dịch vụ (EULA)"
          selected={tab === 'terms'}
          onPress={() => setTab('terms')}
        />
      </View>

      {tab === 'tryon' ? (
        /* CHÍNH SÁCH BẢO VỆ DỮ LIỆU CÁ NHÂN TRONG TÍNH NĂNG AI VIRTUAL TRY-ON */
        <View style={{ gap: 16 }}>
          <GlassSurface radius={24} padding={20}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="security" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.policyTitle}>
                  CHÍNH SÁCH BẢO VỆ DỮ LIỆU CÁ NHÂN
                </Text>
                <Text style={styles.policySubtitle}>
                  Tính năng Thử Đồ Ảo (AI Virtual Try-On)
                </Text>
              </View>
            </View>
            <View style={styles.legalNoticeBox}>
              <Text style={styles.legalNoticeText}>
                • Căn cứ Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15.{'\n'}
                • Căn cứ Nghị định số 356/2025/NĐ-CP của Chính phủ.{'\n'}
                • Áp dụng cho mọi hoạt động xử lý ảnh và số đo trên MIROIR.
              </Text>
            </View>
          </GlassSurface>

          {/* Chương 1 */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>CHƯƠNG I. QUY ĐỊNH CHUNG</Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>1. Phạm vi điều chỉnh:</Text> Quy định việc thu thập, xử lý,
              lưu trữ và xóa dữ liệu cá nhân (ảnh chân dung, số đo cơ thể) khi Khách hàng sử dụng
              tính năng AI Virtual Try-On trên nền tảng MIROIR.
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>2. Nguyên tắc xử lý dữ liệu:</Text>
              {'\n'}• <Text style={styles.bold}>Hợp pháp, minh bạch:</Text> Thông báo rõ ràng trước
              khi xử lý dữ liệu.
              {'\n'}• <Text style={styles.bold}>Tối thiểu hóa:</Text> Hệ thống loại bỏ khuôn mặt để
              bảo vệ danh tính cá nhân.
              {'\n'}• <Text style={styles.bold}>Giới hạn mục đích:</Text> Dữ liệu chỉ dùng để tạo kết
              quả thử trang phục phục vụ trải nghiệm mua sắm của chính bạn.
            </Text>
          </Card>

          {/* Chương 2 */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>
              CHƯƠNG II. ĐIỀU KIỆN SỬ DỤNG & SỰ ĐỒNG Ý
            </Text>
            <Text style={styles.paragraph}>
              Khi sử dụng tính năng thử đồ ảo, Khách hàng xác nhận và đồng ý:
              {'\n'}a) Người sử dụng từ đủ 18 tuổi hoặc có sự đồng ý của người giám hộ hợp pháp.
              {'\n'}b) Bạn là người có trong ảnh hoặc được sự cho phép rõ ràng của chủ thể ảnh.
              {'\n'}c) Bạn có toàn quyền rút lại sự đồng ý hoặc yêu cầu xóa dữ liệu bất kỳ lúc nào
              thông qua tính năng Xóa tài khoản hoặc xóa ảnh trong ứng dụng.
            </Text>
          </Card>

          {/* Chương 3 */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>
              CHƯƠNG III. CAM KẾT BẢO VỆ VÀ THỜI HẠN LƯU TRỮ
            </Text>
            <View style={styles.highlightBadge}>
              <MaterialIcons name="verified-user" size={18} color="#278E49" />
              <Text style={styles.highlightBadgeText}>
                Cam kết KHÔNG thu thập & KHÔNG nhận dạng sinh trắc học
              </Text>
            </View>
            <Text style={styles.paragraph}>
              MIROIR cam kết:
              {'\n'}• <Text style={styles.bold}>Không nhận dạng khuôn mặt:</Text> Không tạo, không trích
              xuất và không lưu trữ Mẫu nhận dạng khuôn mặt hay Dữ liệu sinh trắc học.
              {'\n'}• <Text style={styles.bold}>Không dùng huấn luyện:</Text> Ảnh tải lên không dùng để
              huấn luyện các mô hình AI thương mại khác.
              {'\n'}• <Text style={styles.bold}>Không chia sẻ:</Text> Không bán, cho thuê hay cung cấp
              ảnh của bạn cho bên thứ ba cho mục đích quảng cáo/tiếp thị.
              {'\n'}• <Text style={styles.bold}>Tự động xóa trong 24 giờ:</Text> Ảnh tải lên và ảnh kết
              quả thử đồ tự động xóa hoàn toàn khỏi máy chủ xử lý sau 24 giờ, trừ khi bạn chủ động lưu
              vào tủ đồ cá nhân.
            </Text>
          </Card>

          {/* Chương 4 */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>
              CHƯƠNG IV. QUYỀN CỦA BẠN & LIÊN HỆ
            </Text>
            <Text style={styles.paragraph}>
              Bạn có quyền:
              {'\n'}1. Yêu cầu xem lại, tải xuống hoặc xóa vĩnh viễn hình ảnh đã lưu.
              {'\n'}2. Xóa tài khoản và toàn bộ lịch sử cá nhân trong phần Cài đặt tài khoản.
              {'\n'}3. Mọi thắc mắc và khiếu nại về dữ liệu cá nhân, vui lòng liên hệ Ban Quản Trị
              MIROIR qua email: <Text style={styles.linkText}>support@miroir.fashion</Text>.
            </Text>
          </Card>
        </View>
      ) : (
        /* ĐIỀU KHOẢN DỊCH VỤ (EULA - APPLE COMPLIANCE) */
        <View style={{ gap: 16 }}>
          <GlassSurface radius={24} padding={20}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="gavel" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.policyTitle}>ĐIỀU KHOẢN DỊCH VỤ (EULA)</Text>
                <Text style={styles.policySubtitle}>
                  Thỏa thuận người dùng cuối trên nền tảng MIROIR
                </Text>
              </View>
            </View>
          </GlassSurface>

          <Card style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>1. Chấp thuận điều khoản</Text>
            <Text style={styles.paragraph}>
              Bằng việc cài đặt, đăng ký hoặc sử dụng ứng dụng MIROIR, bạn xác nhận đã đọc, hiểu và đồng
              ý chịu sự ràng buộc bởi các điều khoản này. Nếu không đồng ý, vui lòng ngừng sử dụng ứng
              dụng.
            </Text>
          </Card>

          <Card style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>
              2. Tiêu chuẩn nội dung & Quy định cấm (Apple Guideline 1.2)
            </Text>
            <Text style={styles.paragraph}>
              Người dùng cam kết tuyệt đối <Text style={styles.bold}>KHÔNG</Text> thực hiện các hành
              vi sau khi sử dụng ứng dụng hoặc tính năng tin nhắn:
              {'\n'}• Tải lên hình ảnh khỏa thân, khiêu dâm, bạo lực hoặc trái với thuần phong mỹ tục.
              {'\n'}• Sử dụng hình ảnh của người khác khi chưa được sự đồng ý hợp pháp.
              {'\n'}• Gửi tin nhắn quấy rối, xúc phạm, đe dọa hoặc lừa đảo.
              {'\n'}
              <Text style={styles.bold}>Biện pháp xử lý:</Text> Bất kỳ tài khoản nào vi phạm sẽ bị khóa
              vĩnh viễn ngay lập tức và xóa toàn bộ nội dung mà không cần báo trước. Người dùng có thể
              sử dụng nút Báo cáo (Report) trong phần tin nhắn để thông báo vi phạm.
            </Text>
          </Card>

          <Card style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>3. Quyền sở hữu trí tuệ</Text>
            <Text style={styles.paragraph}>
              Toàn bộ bản quyền đối với giao diện, logo, thuật toán AI Virtual Try-On và dữ liệu hệ thống
              thuộc quyền sở hữu độc quyền của MIROIR. Các thương hiệu thời trang chịu trách nhiệm về
              hình ảnh và thông số sản phẩm do chính thương hiệu đăng tải.
            </Text>
          </Card>

          <Card style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>4. Xóa tài khoản & Dữ liệu</Text>
            <Text style={styles.paragraph}>
              Theo quy định của Apple và Luật Bảo vệ dữ liệu cá nhân, bạn có quyền yêu cầu xóa toàn bộ
              tài khoản và dữ liệu liên quan bất cứ lúc nào trong mục Cài đặt tài khoản.
            </Text>
          </Card>
        </View>
      )}

      <View style={{ marginTop: 24, marginBottom: 20 }}>
        <MiroirButton
          label="Đã hiểu và đồng ý"
          icon="check"
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/');
            }
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  policyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
  },
  policySubtitle: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  legalNoticeBox: {
    backgroundColor: colors.accentSoft,
    padding: 12,
    borderRadius: 14,
    marginTop: 14,
  },
  legalNoticeText: {
    fontSize: 12,
    color: colors.ink,
    lineHeight: 18,
    fontWeight: '500',
  },
  sectionCard: {
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 13,
    color: colors.ink,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '700',
  },
  highlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EBF6EC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 10,
  },
  highlightBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#278E49',
    flex: 1,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '700',
  },
});
