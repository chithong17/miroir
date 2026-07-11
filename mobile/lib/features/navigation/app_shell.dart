import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../shared/widgets/glass_surface.dart';
import '../account/presentation/account_page.dart';
import '../home/presentation/home_page.dart';
import '../stylist/presentation/stylist_page.dart';
import '../try_on/presentation/try_on_page.dart';

class AppShell extends StatefulWidget {
  const AppShell({
    super.key,
    this.initialIndex = 0,
  });

  final int initialIndex;

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  late int _currentIndex = widget.initialIndex;

  late final List<Widget> _pages = [
    const HomePage(),
    const TryOnPage(),
    const StylistPage(),
    const AccountPage(),
  ];

  final _items = const [
    (Icons.home_outlined, Icons.home_rounded, 'Home'),
    (Icons.checkroom_outlined, Icons.checkroom, 'Try On'),
    (Icons.auto_awesome_outlined, Icons.auto_awesome, 'Stylist'),
    (Icons.person_outline, Icons.person, 'Account'),
  ];

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
          child: IndexedStack(
            index: _currentIndex,
            children: _pages,
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
            children: List.generate(_items.length, (index) {
              final item = _items[index];
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
                        setState(() {
                          _currentIndex = index;
                        });
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
