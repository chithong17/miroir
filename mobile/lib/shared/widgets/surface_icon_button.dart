import 'dart:ui';

import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

class SurfaceIconButton extends StatelessWidget {
  const SurfaceIconButton({
    super.key,
    required this.icon,
    this.onPressed,
    this.isDark = false,
    this.size = 46,
    this.isGlass = true,
  });

  final IconData icon;
  final VoidCallback? onPressed;
  final bool isDark;
  final double size;
  final bool isGlass;

  @override
  Widget build(BuildContext context) {
    final background = isDark
        ? AppColors.ink
        : isGlass
            ? AppColors.glass
            : Colors.white;
    final borderColor = isDark
        ? Colors.transparent
        : isGlass
            ? AppColors.glassLine
            : AppColors.line;

    return ClipOval(
      child: BackdropFilter(
        filter: ImageFilter.blur(
          sigmaX: isGlass && !isDark ? 16 : 0,
          sigmaY: isGlass && !isDark ? 16 : 0,
        ),
        child: Material(
          color: background,
          shape: const CircleBorder(),
          child: Ink(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: borderColor),
              boxShadow: [
                BoxShadow(
                  color: isDark ? const Color(0x16000000) : AppColors.glassShadow,
                  blurRadius: 18,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: InkWell(
              customBorder: const CircleBorder(),
              onTap: onPressed,
              child: SizedBox(
                width: size,
                height: size,
                child: Icon(
                  icon,
                  color: isDark ? Colors.white : AppColors.ink,
                  size: 20,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
