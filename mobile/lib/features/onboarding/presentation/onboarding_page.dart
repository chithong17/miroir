import 'package:flutter/material.dart';

import '../../../core/app/app_session_scope.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/miroir_button.dart';
import '../../../shared/widgets/surface_icon_button.dart';

class OnboardingPage extends StatefulWidget {
  const OnboardingPage({super.key});

  @override
  State<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends State<OnboardingPage> {
  final _pageController = PageController(viewportFraction: 0.92);
  int _currentIndex = 0;

  static const _slides = [
    _OnboardingSlide(
      title: 'Welcome to MIROIR',
      body:
          'Explore AI-powered fashion tools that help you discover outfits faster and with more confidence.',
      tag: 'Smart styling',
      accent: Color(0xFFE7F5FA),
      secondary: Color(0xFFFDF6E9),
      icon: Icons.auto_awesome_rounded,
      previewTitle: 'Curated home',
      previewBody:
          'Browse premium looks, saved edits, and quick AI tools from one place.',
    ),
    _OnboardingSlide(
      title: 'Try looks on before you buy',
      body:
          'Upload your photo, add garments, and preview the full outfit with the virtual try-on flow.',
      tag: 'Virtual try-on',
      accent: Color(0xFFF2EEFB),
      secondary: Color(0xFFE8F5EF),
      icon: Icons.checkroom_rounded,
      previewTitle: 'Studio preview',
      previewBody:
          'Build a fitting session with your model photo and garments in just a few taps.',
    ),
    _OnboardingSlide(
      title: 'Get curated outfit suggestions',
      body:
          'Describe the vibe you want and let the AI Stylist turn your prompt into grounded combinations.',
      tag: 'AI stylist',
      accent: Color(0xFFEAF6EF),
      secondary: Color(0xFFEAF1FB),
      icon: Icons.style_rounded,
      previewTitle: 'Prompt to outfit',
      previewBody:
          'Turn a simple mood or occasion into multiple polished outfit recommendations.',
    ),
  ];

  Future<void> _finish() async {
    final sessionController = AppSessionScope.of(context);
    await sessionController.completeOnboarding();
  }

  void _next() {
    if (_currentIndex == _slides.length - 1) {
      _finish();
      return;
    }

    _pageController.nextPage(
      duration: const Duration(milliseconds: 280),
      curve: Curves.easeOutCubic,
    );
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final slide = _slides[_currentIndex];

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFFFAFBFC),
              Color(0xFFF3F6F9),
            ],
          ),
        ),
        child: SafeArea(
          child: Stack(
            children: [
              const Positioned(
                top: -30,
                left: -20,
                child: _BackdropOrb(size: 180, color: AppColors.accentSoft),
              ),
              const Positioned(
                top: 180,
                right: -50,
                child: _BackdropOrb(size: 220, color: Color(0xFFF4EAFB)),
              ),
              const Positioned(
                bottom: 90,
                left: -30,
                child: _BackdropOrb(size: 160, color: Color(0xFFE8F5EF)),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 14, 20, 24),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 42,
                          height: 42,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.72),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                                color: Colors.white.withValues(alpha: 0.9)),
                          ),
                          child: const Icon(Icons.diamond_outlined,
                              color: AppColors.ink, size: 20),
                        ),
                        const Spacer(),
                        Container(
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.68),
                            borderRadius: BorderRadius.circular(999),
                            border: Border.all(
                                color: Colors.white.withValues(alpha: 0.92)),
                          ),
                          child: TextButton(
                            onPressed: _finish,
                            child: const Text('Skip'),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),
                    Expanded(
                      child: PageView.builder(
                        controller: _pageController,
                        onPageChanged: (index) {
                          setState(() {
                            _currentIndex = index;
                          });
                        },
                        itemCount: _slides.length,
                        itemBuilder: (context, index) {
                          final item = _slides[index];
                          return Padding(
                            padding: const EdgeInsets.only(right: 10),
                            child: _GlassSlideCard(slide: item),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 18),
                    Row(
                      children: [
                        ...List.generate(_slides.length, (index) {
                          final selected = index == _currentIndex;
                          return AnimatedContainer(
                            duration: const Duration(milliseconds: 220),
                            margin: EdgeInsets.only(
                                right: index == _slides.length - 1 ? 0 : 8),
                            width: selected ? 28 : 10,
                            height: 10,
                            decoration: BoxDecoration(
                              color: selected ? AppColors.ink : AppColors.line,
                              borderRadius: BorderRadius.circular(999),
                            ),
                          );
                        }),
                        const Spacer(),
                        Text(
                          '${_currentIndex + 1}/${_slides.length}',
                          style: textTheme.bodySmall,
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.72),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(
                            color: Colors.white.withValues(alpha: 0.95)),
                        boxShadow: const [
                          BoxShadow(
                            color: Color(0x0F111318),
                            blurRadius: 18,
                            offset: Offset(0, 8),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(slide.previewTitle,
                                    style: textTheme.titleMedium),
                                const SizedBox(height: 6),
                                Text(
                                  _currentIndex == _slides.length - 1
                                      ? 'Everything is ready. Start exploring the app now.'
                                      : 'Swipe through the intro or continue with the next step.',
                                  style: textTheme.bodyMedium,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          SizedBox(
                            width: 154,
                            child: MiroirButton(
                              label: _currentIndex == _slides.length - 1
                                  ? 'Get Started'
                                  : 'Next',
                              onPressed: _next,
                              icon: _currentIndex == _slides.length - 1
                                  ? Icons.arrow_forward_rounded
                                  : Icons.chevron_right_rounded,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _GlassSlideCard extends StatelessWidget {
  const _GlassSlideCard({required this.slide});

  final _OnboardingSlide slide;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(34),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Colors.white.withValues(alpha: 0.88),
            Colors.white.withValues(alpha: 0.58),
          ],
        ),
        border: Border.all(color: Colors.white.withValues(alpha: 0.95)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x14111318),
            blurRadius: 28,
            offset: Offset(0, 14),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(34),
        child: Stack(
          children: [
            Positioned(
              top: -30,
              right: -20,
              child: _BackdropOrb(size: 140, color: slide.accent),
            ),
            Positioned(
              bottom: 120,
              left: -18,
              child: _BackdropOrb(size: 120, color: slide.secondary),
            ),
            LayoutBuilder(
              builder: (context, constraints) {
                return SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(22, 22, 22, 22),
                  child: ConstrainedBox(
                    constraints:
                        BoxConstraints(minHeight: constraints.maxHeight - 44),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 7),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.8),
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Text(
                                slide.tag,
                                style: textTheme.bodySmall?.copyWith(
                                  color: AppColors.ink,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                            const Spacer(),
                            SurfaceIconButton(icon: slide.icon, size: 40),
                          ],
                        ),
                        const SizedBox(height: 18),
                        _PhoneMockup(slide: slide),
                        const SizedBox(height: 18),
                        Text(slide.title, style: textTheme.headlineMedium),
                        const SizedBox(height: 8),
                        Text(slide.body, style: textTheme.bodyLarge),
                      ],
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _PhoneMockup extends StatelessWidget {
  const _PhoneMockup({required this.slide});

  final _OnboardingSlide slide;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Container(
      height: 220,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(30),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [slide.accent, slide.secondary],
        ),
      ),
      child: Center(
        child: AspectRatio(
          aspectRatio: 0.62,
          child: Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.84),
              borderRadius: BorderRadius.circular(30),
              border: Border.all(color: Colors.white.withValues(alpha: 0.95)),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x12111318),
                  blurRadius: 18,
                  offset: Offset(0, 10),
                ),
              ],
            ),
            child: Column(
              children: [
                Container(
                  width: 58,
                  height: 14,
                  decoration: BoxDecoration(
                    color: AppColors.ink,
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
                const SizedBox(height: 8),
                Expanded(
                  child: Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(20),
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          Colors.white.withValues(alpha: 0.58),
                          Colors.black.withValues(alpha: 0.08),
                        ],
                      ),
                    ),
                    child: Stack(
                      children: [
                        Positioned(
                          top: 10,
                          right: 10,
                          child: Container(
                            width: 24,
                            height: 24,
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.78),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(slide.icon,
                                size: 12, color: AppColors.ink),
                          ),
                        ),
                        Positioned(
                          left: 12,
                          right: 12,
                          bottom: 12,
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.74),
                                  borderRadius: BorderRadius.circular(999),
                                ),
                                child: Text(
                                  slide.tag,
                                  style: textTheme.bodySmall?.copyWith(
                                    color: AppColors.ink,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(slide.previewTitle,
                                  style: textTheme.titleMedium),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.7),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _MockLine(widthFactor: 1),
                      SizedBox(height: 8),
                      _MockLine(widthFactor: 0.74),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.ink,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.auto_awesome_rounded,
                          size: 14, color: Colors.white),
                      SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          'Get started',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                              color: Colors.white, fontWeight: FontWeight.w700),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _MockLine extends StatelessWidget {
  const _MockLine({required this.widthFactor});

  final double widthFactor;

  @override
  Widget build(BuildContext context) {
    return FractionallySizedBox(
      widthFactor: widthFactor,
      child: Container(
        height: 12,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.9),
          borderRadius: BorderRadius.circular(999),
        ),
      ),
    );
  }
}

class _MockMiniCard extends StatelessWidget {
  const _MockMiniCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 64,
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.74),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: const [
          _MockLine(widthFactor: 0.7),
          SizedBox(height: 8),
          _MockLine(widthFactor: 1),
        ],
      ),
    );
  }
}

class _BackdropOrb extends StatelessWidget {
  const _BackdropOrb({required this.size, required this.color});

  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(
            colors: [
              color.withValues(alpha: 0.9),
              color.withValues(alpha: 0.0),
            ],
          ),
        ),
      ),
    );
  }
}

class _OnboardingSlide {
  const _OnboardingSlide({
    required this.title,
    required this.body,
    required this.tag,
    required this.accent,
    required this.secondary,
    required this.icon,
    required this.previewTitle,
    required this.previewBody,
  });

  final String title;
  final String body;
  final String tag;
  final Color accent;
  final Color secondary;
  final IconData icon;
  final String previewTitle;
  final String previewBody;
}
