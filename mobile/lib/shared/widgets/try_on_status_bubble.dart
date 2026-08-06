import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../features/try_on/presentation/controllers/try_on_controller.dart';

class TryOnStatusBubble extends StatelessWidget {
  const TryOnStatusBubble({
    super.key,
    required this.controller,
    required this.onTap,
  });

  final TryOnController controller;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) {
        final state = controller.state;
        final isWorking = state == TryOnViewState.creating ||
            state == TryOnViewState.polling;
        final hasCompleted = state == TryOnViewState.completed ||
            state == TryOnViewState.completedWithoutUrl;
        final needsAttention = state == TryOnViewState.failed ||
            state == TryOnViewState.timedOut;
        final hasUnreadResult = hasCompleted && controller.hasUnreadCompletion;
        final isVisible = isWorking || hasUnreadResult || needsAttention;
        final background = needsAttention
            ? AppColors.dangerSoft
            : hasCompleted
                ? AppColors.success
                : AppColors.accentStrong;

        return IgnorePointer(
          ignoring: !isVisible,
          child: AnimatedOpacity(
            duration: const Duration(milliseconds: 220),
            opacity: isVisible ? 1 : 0,
            child: AnimatedScale(
              duration: const Duration(milliseconds: 220),
              curve: Curves.easeOutBack,
              scale: isVisible ? 1 : 0.82,
              child: SizedBox(
                width: 66,
                height: 66,
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Positioned(
                      left: 0,
                      bottom: 0,
                      child: DecoratedBox(
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: Color(0x2917210F),
                              blurRadius: 18,
                              offset: Offset(0, 8),
                            ),
                          ],
                        ),
                        child: Material(
                          color: background,
                          shape: const CircleBorder(
                            side: BorderSide(color: Colors.white, width: 2),
                          ),
                          clipBehavior: Clip.antiAlias,
                          child: InkWell(
                            onTap: onTap,
                            customBorder: const CircleBorder(),
                            child: SizedBox(
                              width: 58,
                              height: 58,
                              child: Stack(
                                alignment: Alignment.center,
                                children: [
                                  if (isWorking) ...[
                                    const Icon(
                                      Icons.checkroom_rounded,
                                      color: Colors.white,
                                      size: 21,
                                    ),
                                    const SizedBox(
                                      width: 44,
                                      height: 44,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2.4,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ] else
                                    Icon(
                                      needsAttention
                                          ? Icons.error_outline_rounded
                                          : Icons.check_rounded,
                                      color: needsAttention
                                          ? const Color(0xFFD95D5D)
                                          : Colors.white,
                                      size: 27,
                                    ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    if (hasUnreadResult)
                      Positioned(
                        top: 0,
                        right: 0,
                        child: Container(
                          width: 16,
                          height: 16,
                          decoration: BoxDecoration(
                            color: const Color(0xFFE55353),
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}