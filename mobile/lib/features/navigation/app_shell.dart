import 'package:flutter/material.dart';

import '../../core/i18n/app_localizations.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/glass_surface.dart';
import '../../shared/widgets/try_on_status_bubble.dart';
import '../account/presentation/account_page.dart';
import '../home/presentation/home_page.dart';
import '../stylist/presentation/stylist_page.dart';
import '../try_on/presentation/try_on_page.dart';
import '../try_on/presentation/controllers/try_on_controller.dart';
import '../marketplace/data/catalog_models.dart';

final _catalogTryOnRequest = ValueNotifier<int>(0);

class AppShell extends StatefulWidget {
  const AppShell({
    super.key,
    this.initialIndex = 0,
  });

  final int initialIndex;

  static void openCatalogTryOn(BuildContext context, CatalogProduct product) {
    TryOnController.shared.prefillFromCatalogProduct(product);
    Navigator.of(context, rootNavigator: true).popUntil((route) => route.isFirst);
    _catalogTryOnRequest.value++;
  }

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  late int _currentIndex = widget.initialIndex;
  final _tryOnController = TryOnController.shared;
  final _tryOnPreviewKey = GlobalKey();
  OverlayEntry? _tryOnStatusOverlay;
  final _showTryOnBubble = ValueNotifier<bool>(true);

  late final List<Widget> _pages = [
    const HomePage(),
    TryOnPage(
      controller: _tryOnController,
      previewKey: _tryOnPreviewKey,
    ),
    const StylistPage(),
    const AccountPage(),
  ];

  void _selectTab(int index) {
    if (_currentIndex != index) {
      setState(() => _currentIndex = index);
    }
    _showTryOnBubble.value = index != 1;
  }

  void _openCatalogTryOn() {
    if (!mounted) return;
    _selectTab(1);
  }

  void _openTryOnStatus() {
    Navigator.of(context, rootNavigator: true)
        .popUntil((route) => route.isFirst);
    _selectTab(1);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final previewContext = _tryOnPreviewKey.currentContext;
      if (previewContext != null) {
        Scrollable.ensureVisible(
          previewContext,
          duration: const Duration(milliseconds: 360),
          curve: Curves.easeOutCubic,
          alignment: 0.18,
        );
      }
      _tryOnController.markCompletionSeen();
    });
  }

  @override
  void initState() {
    super.initState();
    _showTryOnBubble.value = _currentIndex != 1;
    _catalogTryOnRequest.addListener(_openCatalogTryOn);
    WidgetsBinding.instance.addPostFrameCallback((_) => _insertTryOnStatusOverlay());
  }

  void _insertTryOnStatusOverlay() {
    if (!mounted || _tryOnStatusOverlay != null) return;
    final overlay = Overlay.of(context, rootOverlay: true);
    _tryOnStatusOverlay = OverlayEntry(
      builder: (_) => ValueListenableBuilder<bool>(
        valueListenable: _showTryOnBubble,
        builder: (_, isVisible, __) => isVisible
            ? Positioned(
                right: 18,
                bottom: 106,
                child: TryOnStatusBubble(
                  controller: _tryOnController,
                  onTap: _openTryOnStatus,
                ),
              )
            : const SizedBox.shrink(),
      ),
    );
    overlay.insert(_tryOnStatusOverlay!);
  }

  @override
  void dispose() {
    _catalogTryOnRequest.removeListener(_openCatalogTryOn);
    _showTryOnBubble.dispose();
    _tryOnStatusOverlay?.remove();
    _tryOnStatusOverlay = null;
    super.dispose();
  }

  List<(IconData, IconData, String)> _getItems(BuildContext context) {
    return [
      (Icons.home_outlined, Icons.home_rounded, AppLocalizations.t(context, 'nav.marketplace')),
      (Icons.checkroom_outlined, Icons.checkroom, AppLocalizations.t(context, 'nav.tryOn')),
      (Icons.auto_awesome_outlined, Icons.auto_awesome, AppLocalizations.t(context, 'nav.stylist')),
      (Icons.person_outline, Icons.person, AppLocalizations.t(context, 'nav.account')),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFFF9FBFE),
              AppColors.canvas,
              AppColors.canvasStrong,
            ],
          ),
        ),
        child: SafeArea(
          bottom: false,
          child: Stack(
            children: [
              Positioned.fill(
                child: IndexedStack(
                  index: _currentIndex,
                  children: _pages,
                ),
              ),

            ],
          ),
        ),
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        minimum: const EdgeInsets.fromLTRB(18, 8, 18, 12),
        child: GlassSurface(
          radius: 34,
          blurSigma: 18,
          shadowOpacity: 0.34,
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          child: Row(
            children: List.generate(_getItems(context).length, (index) {
              final item = _getItems(context)[index];
              final isSelected = index == _currentIndex;
              final icon = isSelected ? item.$2 : item.$1;
              final color = isSelected ? Colors.white : AppColors.muted;

              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 2),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      borderRadius: BorderRadius.circular(24),
                      onTap: () {
                        _selectTab(index);
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 240),
                        curve: Curves.easeOutCubic,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppColors.glassSelected
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(24),
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(icon, size: 20, color: color),
                            const SizedBox(height: 4),
                            Text(
                              item.$3,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: 11.5,
                                height: 1,
                                fontWeight: FontWeight.w700,
                                color: color,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}






