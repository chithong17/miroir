import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/glass_pill.dart';
import '../../../shared/widgets/glass_surface.dart';
import '../../../shared/widgets/miroir_button.dart';
import '../../stylist/presentation/stylist_page.dart';
import '../../try_on/presentation/try_on_page.dart';

const _homeGreetingTitle = 'Hello';
const _homeWelcomeLabel = 'Welcome back to MIROIR';
const _homeAvatarLabel = 'M';
const _heroLook = _HeroLookContent(
  title: 'Midnight Minimal Edit',
  description:
      'A clean, sculpted night-out formula with quiet contrast, glossy tailoring, and a modern silhouette.',
  scoreLabel: '5.0',
  picksLabel: '143 saved looks',
  imageUrl: 'https://picsum.photos/700/900?fashion-hero',
);
const _featuredTools = [
  _FeatureTool(
    title: 'AI Stylist',
    subtitle:
        'Describe a vibe and get 5 curated outfits grounded in your current catalog.',
    metric: '5 looks',
    imageUrl: 'https://picsum.photos/360/260?fashion-tool-1',
    destination: _MiniFeatureDestination.stylist,
  ),
  _FeatureTool(
    title: 'Virtual Try-On',
    subtitle: 'Upload your photo and preview the outfit composition instantly.',
    metric: 'Live preview',
    imageUrl: 'https://picsum.photos/360/260?fashion-tool-2',
    destination: _MiniFeatureDestination.tryOn,
  ),
  _FeatureTool(
    title: 'Trending Edit',
    subtitle:
        'Fresh combinations built from what your stores already have in stock.',
    metric: 'Daily refresh',
    imageUrl: 'https://picsum.photos/360/260?fashion-tool-3',
    destination: _MiniFeatureDestination.stylist,
  ),
];

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final _categories = const ['Casual', 'Party', 'Minimal', 'Street', 'Formal'];
  int _selectedCategory = 2;

  void _openTryOn() {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const TryOnPage()),
    );
  }

  void _openStylist() {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const StylistPage()),
    );
  }

  void _openDestination(_MiniFeatureDestination destination) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => destination == _MiniFeatureDestination.tryOn
            ? const TryOnPage()
            : const StylistPage(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 132),
      children: [
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_homeGreetingTitle, style: textTheme.headlineSmall),
                  const SizedBox(height: 5),
                  Text(_homeWelcomeLabel, style: textTheme.bodyMedium),
                ],
              ),
            ),
            const _AvatarBubble(),
          ],
        ),
        const SizedBox(height: 18),
        Row(
          children: [
            Expanded(
              child: GlassSurface(
                radius: 24,
                blurSigma: 14,
                shadowOpacity: 0.34,
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                child: Row(
                  children: [
                    const Icon(Icons.search_rounded,
                        color: AppColors.muted, size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text('Search looks, styles, moods',
                          style: textTheme.bodyMedium),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 12),
            const GlassPill(
              label: 'Live',
              icon: Icons.radio_button_checked_rounded,
            ),
          ],
        ),
        const SizedBox(height: 24),
        Row(
          children: [
            Expanded(
              child: Text('Select your next look', style: textTheme.titleLarge),
            ),
            Text('Swipe to explore', style: textTheme.bodySmall),
          ],
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 44,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemBuilder: (context, index) {
              final selected = index == _selectedCategory;
              return ChoiceChip(
                label: Text(_categories[index]),
                selected: selected,
                onSelected: (_) {
                  setState(() {
                    _selectedCategory = index;
                  });
                },
              );
            },
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemCount: _categories.length,
          ),
        ),
        const SizedBox(height: 18),
        _HeroLookCard(
          category: _categories[_selectedCategory],
          content: _heroLook,
          onSeeMore: _openStylist,
        ),
        const SizedBox(height: 18),
        Row(
          children: [
            Expanded(
              child: _QuickActionCard(
                title: 'Try On',
                subtitle: 'Preview your outfit on model photos.',
                icon: Icons.checkroom_rounded,
                tint: AppColors.accentSoft,
                onTap: _openTryOn,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _QuickActionCard(
                title: 'Stylist',
                subtitle: 'Get 5 AI-curated outfit suggestions.',
                icon: Icons.auto_awesome_rounded,
                tint: const Color(0xFFF0EEFB),
                onTap: _openStylist,
              ),
            ),
          ],
        ),
        const SizedBox(height: 26),
        Row(
          children: [
            Expanded(
              child: Text('Featured AI tools', style: textTheme.titleLarge),
            ),
            Text('Swipe', style: textTheme.bodySmall),
          ],
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 292,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            clipBehavior: Clip.none,
            padding: const EdgeInsets.symmetric(vertical: 8),
            itemCount: _featuredTools.length,
            separatorBuilder: (_, __) => const SizedBox(width: 14),
            itemBuilder: (context, index) {
              final tool = _featuredTools[index];
              return _MiniFeatureCard(
                tool: tool,
                onTap: () => _openDestination(tool.destination),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _AvatarBubble extends StatelessWidget {
  const _AvatarBubble();

  @override
  Widget build(BuildContext context) {
    return GlassSurface(
      radius: 999,
      blurSigma: 14,
      padding: EdgeInsets.zero,
      shadowOpacity: 0.24,
      child: SizedBox(
        width: 48,
        height: 48,
        child: Center(
          child: Text(
            _homeAvatarLabel,
            style: Theme.of(context).textTheme.titleMedium,
          ),
        ),
      ),
    );
  }
}

class _HeroLookCard extends StatelessWidget {
  const _HeroLookCard({
    required this.category,
    required this.content,
    required this.onSeeMore,
  });

  final String category;
  final _HeroLookContent content;
  final VoidCallback onSeeMore;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(34),
      child: SizedBox(
        height: 360,
        child: Stack(
          fit: StackFit.expand,
          children: [
            Image.network(
              content.imageUrl,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) =>
                  Container(color: AppColors.elevated),
            ),
            DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.white.withValues(alpha: 0.08),
                    Colors.transparent,
                    Colors.black.withValues(alpha: 0.52),
                  ],
                ),
              ),
            ),
            Positioned(
              top: 16,
              left: 16,
              child: GlassPill(label: category),
            ),
            const Positioned(
              top: 16,
              right: 16,
              child: GlassPill(
                label: 'Featured',
                icon: Icons.auto_awesome_rounded,
              ),
            ),
            Positioned(
              left: 16,
              right: 16,
              bottom: 16,
              child: GlassSurface(
                radius: 28,
                blurSigma: 16,
                shadowOpacity: 0.28,
                color: AppColors.glassSoft,
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      content.title,
                      style: Theme.of(context)
                          .textTheme
                          .headlineSmall
                          ?.copyWith(color: AppColors.ink),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      content.description,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.ink.withValues(alpha: 0.8),
                          ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        const GlassPill(
                          label: 'AI Rated',
                          icon: Icons.star_rounded,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          content.scoreLabel,
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            content.picksLabel,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall
                                ?.copyWith(
                                  color: AppColors.ink.withValues(alpha: 0.72),
                                ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(
                          child: MiroirButton(
                            label: 'Open Stylist',
                            onPressed: onSeeMore,
                            icon: Icons.auto_awesome,
                          ),
                        ),
                        const SizedBox(width: 10),
                        GlassSurface(
                          radius: 999,
                          blurSigma: 14,
                          padding: EdgeInsets.zero,
                          shadowOpacity: 0.2,
                          child: InkWell(
                            onTap: onSeeMore,
                            borderRadius: BorderRadius.circular(999),
                            child: const SizedBox(
                              width: 50,
                              height: 50,
                              child: Icon(
                                Icons.arrow_forward_rounded,
                                color: AppColors.ink,
                                size: 20,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  const _QuickActionCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.tint,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final Color tint;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(28),
      onTap: onTap,
      child: GlassSurface(
        radius: 28,
        blurSigma: 16,
        shadowOpacity: 0.3,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: tint,
                borderRadius: BorderRadius.circular(15),
              ),
              child: Icon(icon, color: AppColors.ink, size: 20),
            ),
            const SizedBox(height: 14),
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 6),
            Text(subtitle, style: Theme.of(context).textTheme.bodyMedium),
          ],
        ),
      ),
    );
  }
}

enum _MiniFeatureDestination { stylist, tryOn }

class _MiniFeatureCard extends StatelessWidget {
  const _MiniFeatureCard({
    required this.tool,
    required this.onTap,
  });

  final _FeatureTool tool;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(30),
      onTap: onTap,
      child: SizedBox(
        width: 244,
        child: GlassSurface(
          radius: 30,
          blurSigma: 14,
          shadowOpacity: 0.24,
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(22),
                child: Image.network(
                  tool.imageUrl,
                  height: 118,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) =>
                      Container(height: 118, color: AppColors.elevated),
                ),
              ),
              const SizedBox(height: 14),
              Text(
                tool.title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 6),
              Expanded(
                child: Text(
                  tool.subtitle,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  GlassPill(label: tool.metric),
                  const Spacer(),
                  GlassSurface(
                    radius: 999,
                    blurSigma: 14,
                    padding: EdgeInsets.zero,
                    shadowOpacity: 0.18,
                    child: const SizedBox(
                      width: 40,
                      height: 40,
                      child: Icon(
                        Icons.arrow_forward_rounded,
                        color: AppColors.ink,
                        size: 18,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HeroLookContent {
  const _HeroLookContent({
    required this.title,
    required this.description,
    required this.scoreLabel,
    required this.picksLabel,
    required this.imageUrl,
  });

  final String title;
  final String description;
  final String scoreLabel;
  final String picksLabel;
  final String imageUrl;
}

class _FeatureTool {
  const _FeatureTool({
    required this.title,
    required this.subtitle,
    required this.metric,
    required this.imageUrl,
    required this.destination,
  });

  final String title;
  final String subtitle;
  final String metric;
  final String imageUrl;
  final _MiniFeatureDestination destination;
}

