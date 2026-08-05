import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppLocalizations {
  static const Map<String, Map<String, String>> _translations = {
    'en': {
      'nav.marketplace': 'Home',
      'nav.stylist': 'Stylist',
      'nav.tryOn': 'Try-on',
      'nav.account': 'Account',
      'account.title': 'Account',
      'account.language': 'Language',
      'account.english': 'English',
      'account.vietnamese': 'Vietnamese',
      'account.login': 'Login',
      'account.logout': 'Logout',
    },
    'vi': {
      'nav.marketplace': 'Trang Chủ',
      'nav.stylist': 'Stylist',
      'nav.tryOn': 'Thử Đồ',
      'nav.account': 'Tài Khoản',
      'account.title': 'Tài Khoản',
      'account.language': 'Ngôn ngữ',
      'account.english': 'Tiếng Anh',
      'account.vietnamese': 'Tiếng Việt',
      'account.login': 'Đăng nhập',
      'account.logout': 'Đăng xuất',
    }
  };

  static String t(BuildContext context, String key) {
    final languageCode = LanguageController.of(context).languageCode;
    return _translations[languageCode]?[key] ?? _translations['en']?[key] ?? key;
  }
}

class LanguageController extends ChangeNotifier {
  LanguageController() {
    _loadLanguage();
  }

  String _languageCode = 'en';

  String get languageCode => _languageCode;

  Future<void> _loadLanguage() async {
    final prefs = await SharedPreferences.getInstance();
    final savedCode = prefs.getString('language_code');
    if (savedCode != null) {
      _languageCode = savedCode;
      notifyListeners();
    }
  }

  Future<void> setLanguage(String code) async {
    _languageCode = code;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('language_code', code);
  }
  
  static LanguageController of(BuildContext context) {
    return context.dependOnInheritedWidgetOfExactType<LanguageScope>()!.controller;
  }
}

class LanguageScope extends InheritedNotifier<LanguageController> {
  const LanguageScope({
    super.key,
    required LanguageController controller,
    required super.child,
  }) : super(notifier: controller);

  LanguageController get controller => notifier!;
}
