import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import 'glass_surface.dart';

class GlassPill extends StatelessWidget {
  const GlassPill({
    super.key,
    required this.label,
    this.icon,
    this.isSelected = false,
    this.padding,
  });

  final String label;
  final IconData? icon;
  final bool isSelected;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    final textStyle = Theme.of(context).textTheme.bodySmall?.copyWith(
          color: isSelected ? Colors.white : AppColors.ink,
          fontWeight: FontWeight.w700,
          fontSize: 13,
          height: 1.05,
        );

    if (isSelected) {
      return Container(
        padding:
            padding ?? const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
        decoration: BoxDecoration(
          color: AppColors.glassSelected,
          borderRadius: BorderRadius.circular(999),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 14, color: Colors.white),
              const SizedBox(width: 6),
            ],
            Text(label, style: textStyle),
          ],
        ),
      );
    }

    return GlassSurface(
      radius: 999,
      blurSigma: 14,
      padding:
          padding ?? const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
      shadowOpacity: 0.28,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 14, color: AppColors.ink),
            const SizedBox(width: 6),
          ],
          Text(label, style: textStyle),
        ],
      ),
    );
  }
}
