import 'dart:ui';

import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

class SectionCard extends StatelessWidget {
  const SectionCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(18),
    this.radius = 26,
    this.color,
    this.borderColor,
    this.isGlass = false,
    this.blurSigma = 18,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final double radius;
  final Color? color;
  final Color? borderColor;
  final bool isGlass;
  final double blurSigma;

  @override
  Widget build(BuildContext context) {
    final resolvedRadius = BorderRadius.circular(radius);
    final resolvedColor = color ?? (isGlass ? AppColors.glass : AppColors.surface);
    final resolvedBorder = borderColor ?? (isGlass ? AppColors.glassLine : AppColors.line);

    return AnimatedContainer(
      duration: const Duration(milliseconds: 220),
      decoration: BoxDecoration(
        borderRadius: resolvedRadius,
        boxShadow: [
          BoxShadow(
            color: isGlass ? AppColors.glassShadow : const Color(0x0F111318),
            blurRadius: isGlass ? 28 : 18,
            offset: Offset(0, isGlass ? 14 : 8),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: resolvedRadius,
        child: BackdropFilter(
          filter: ImageFilter.blur(
            sigmaX: isGlass ? blurSigma : 0,
            sigmaY: isGlass ? blurSigma : 0,
          ),
          child: DecoratedBox(
            decoration: BoxDecoration(
              borderRadius: resolvedRadius,
              gradient: isGlass
                  ? const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        AppColors.glassStrong,
                        AppColors.glass,
                      ],
                    )
                  : null,
            ),
            child: Material(
              color: resolvedColor,
              shape: RoundedRectangleBorder(
                borderRadius: resolvedRadius,
                side: BorderSide(color: resolvedBorder),
              ),
              clipBehavior: Clip.antiAlias,
              child: Stack(
                children: [
                  if (isGlass)
                    Positioned(
                      top: 0,
                      left: 18,
                      right: 18,
                      child: Container(
                        height: 1,
                        color: AppColors.glassHighlight,
                      ),
                    ),
                  Padding(
                    padding: padding,
                    child: child,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
