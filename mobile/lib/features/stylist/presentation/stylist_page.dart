import 'package:flutter/material.dart';

import '../../../core/app/app_session_scope.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/glass_pill.dart';
import '../../../shared/widgets/glass_surface.dart';
import '../../../shared/widgets/miroir_button.dart';
import '../../../shared/widgets/surface_icon_button.dart';
import '../../payments/presentation/premium_paywall_sheet.dart';
import '../data/stylist_models.dart';
import 'controllers/stylist_controller.dart';

class StylistPage extends StatefulWidget {
  const StylistPage({super.key});

  @override
  State<StylistPage> createState() => _StylistPageState();
}

class _StylistPageState extends State<StylistPage> {
  static const _heroImageUrl = 'https://picsum.photos/700/520?stylist-fashion';

  final _controller = StylistController();
  final _formKey = GlobalKey<FormState>();
  final _promptController = TextEditingController();
  final _userIdController = TextEditingController();
  final _skinToneController = TextEditingController();
  final _bodyShapeController = TextEditingController();
  final _stylePreferencesController = TextEditingController();
  final _feedbackController = TextEditingController();
  final _budgetMinController = TextEditingController();
  final _budgetMaxController = TextEditingController();
  String _gender = '';

  @override
  void dispose() {
    _controller.dispose();
    _promptController.dispose();
    _userIdController.dispose();
    _skinToneController.dispose();
    _bodyShapeController.dispose();
    _stylePreferencesController.dispose();
    _feedbackController.dispose();
    _budgetMinController.dispose();
    _budgetMaxController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final session = AppSessionScope.of(context);
    if (!session.isSignedIn) {
      session.openLogin();
      return;
    }
    if (!session.isPremium) {
      await showPremiumPaywall(
        context,
        session: session,
        reason: 'AI Stylist is a Premium feature. Upgrade to generate grounded outfit boards.',
      );
      return;
    }

    final form = _formKey.currentState;
    if (form == null || !form.validate()) {
      return;
    }

    await _controller.submit(
      StylistRequest(
        prompt: _promptController.text,
        userId: _userIdController.text.trim().isEmpty
            ? AppSessionScope.of(context).currentUser?.id ?? ''
            : _userIdController.text,
        gender: _gender,
        skinTone: _skinToneController.text,
        bodyShape: _bodyShapeController.text,
        stylePreferences: _stylePreferencesController.text
            .split(',')
            .map((item) => item.trim())
            .where((item) => item.isNotEmpty)
            .toList(),
        feedback: _feedbackController.text,
        budgetMin: double.tryParse(_budgetMinController.text),
        budgetMax: double.tryParse(_budgetMaxController.text),
      ),
      token: session.authToken,
    );
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return ListenableBuilder(
      listenable: _controller,
      builder: (context, _) {
        return Material(
          color: AppColors.canvas,
          child: DecoratedBox(
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
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 132),
              children: [
            Row(
              children: [
                SurfaceIconButton(
                  icon: Icons.arrow_back_ios_new_rounded,
                  onPressed: Navigator.of(context).canPop() ? () => Navigator.of(context).maybePop() : null,
                ),
                const Spacer(),
                Text('AI Stylist', style: textTheme.titleLarge),
                const Spacer(),
                const GlassPill(label: 'Live', icon: Icons.auto_awesome_rounded),
              ],
            ),
            const SizedBox(height: 16),
            _StylistHeroCard(textTheme: textTheme),
            const SizedBox(height: 14),
            GlassSurface(
              radius: 32,
              blurSigma: 20,
              padding: const EdgeInsets.all(18),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Describe the look', style: textTheme.headlineSmall),
                              const SizedBox(height: 6),
                              Text(
                                'Turn a mood, silhouette, or occasion into five grounded outfit suggestions.',
                                style: textTheme.bodyMedium,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        const GlassPill(label: '5 looks', icon: Icons.bolt_rounded),
                      ],
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _promptController,
                      maxLines: 5,
                      decoration: const InputDecoration(
                        labelText: 'Prompt',
                        hintText: 'Elegant dinner look with soft neutrals, modern lines, and a refined finish.',
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Prompt is required.';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),
                    GlassSurface(
                      radius: 24,
                      blurSigma: 14,
                      color: AppColors.glassSoft,
                      borderColor: AppColors.glassLineSoft,
                      padding: EdgeInsets.zero,
                      shadowOpacity: 0.4,
                      child: Theme(
                        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
                        child: ExpansionTile(
                          tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                          childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                          title: const Text('Optional profile'),
                          subtitle: const Text('Budget, shape, tone, and style preferences'),
                          children: [
                            TextFormField(
                              controller: _userIdController,
                              decoration: const InputDecoration(labelText: 'User ID'),
                            ),
                            const SizedBox(height: 12),
                            DropdownButtonFormField<String>(
                              initialValue: _gender,
                              decoration: const InputDecoration(labelText: 'Gender'),
                              items: const [
                                DropdownMenuItem(value: '', child: Text('Any')),
                                DropdownMenuItem(value: 'female', child: Text('Female')),
                                DropdownMenuItem(value: 'male', child: Text('Male')),
                                DropdownMenuItem(value: 'unisex', child: Text('Unisex')),
                              ],
                              onChanged: (value) {
                                setState(() {
                                  _gender = value ?? '';
                                });
                              },
                            ),
                            const SizedBox(height: 12),
                            TextFormField(
                              controller: _skinToneController,
                              decoration: const InputDecoration(labelText: 'Skin Tone'),
                            ),
                            const SizedBox(height: 12),
                            TextFormField(
                              controller: _bodyShapeController,
                              decoration: const InputDecoration(labelText: 'Body Shape'),
                            ),
                            const SizedBox(height: 12),
                            TextFormField(
                              controller: _stylePreferencesController,
                              decoration: const InputDecoration(
                                labelText: 'Style Preferences',
                                hintText: 'Minimalist, elegant, monochrome',
                              ),
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Expanded(
                                  child: TextFormField(
                                    controller: _budgetMinController,
                                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                    decoration: const InputDecoration(labelText: 'Budget Min'),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: TextFormField(
                                    controller: _budgetMaxController,
                                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                    decoration: const InputDecoration(labelText: 'Budget Max'),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            TextFormField(
                              controller: _feedbackController,
                              maxLines: 3,
                              decoration: const InputDecoration(labelText: 'Feedback / Notes'),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    MiroirButton(
                      label: _controller.state == StylistViewState.loading ? 'Generating...' : 'Generate 5 Outfits',
                      onPressed: _controller.state == StylistViewState.loading ? null : () => _submit(),
                      icon: Icons.auto_awesome,
                    ),
                  ],
                ),
              ),
            ),
            if (_controller.feedbackMessage.isNotEmpty) ...[
              const SizedBox(height: 14),
              GlassSurface(
                radius: 24,
                blurSigma: 14,
                child: Text(_controller.feedbackMessage),
              ),
            ],
            if (_controller.errorMessage.isNotEmpty && _controller.state == StylistViewState.error) ...[
              const SizedBox(height: 14),
              GlassSurface(
                radius: 24,
                blurSigma: 14,
                color: AppColors.dangerSoft.withValues(alpha: 0.92),
                borderColor: const Color(0xFFFFD1D1),
                child: Text(
                  _controller.errorMessage,
                  style: const TextStyle(color: Colors.redAccent),
                ),
              ),
            ],
            const SizedBox(height: 14),
            _ResultSection(
              controller: _controller,
              userId: AppSessionScope.of(context).currentUser?.id ?? _userIdController.text,
              token: AppSessionScope.of(context).authToken,
            ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _StylistHeroCard extends StatelessWidget {
  const _StylistHeroCard({required this.textTheme});

  final TextTheme textTheme;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(34),
      child: SizedBox(
        height: 256,
        child: Stack(
          fit: StackFit.expand,
          children: [
            Image.network(
              _StylistPageState._heroImageUrl,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(color: AppColors.elevated),
            ),
            DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.white.withValues(alpha: 0.08),
                    Colors.transparent,
                    Colors.black.withValues(alpha: 0.55),
                  ],
                ),
              ),
            ),
            const Positioned(
              top: 16,
              left: 16,
              child: GlassPill(label: 'Curated by AI', icon: Icons.auto_awesome_rounded),
            ),
            Positioned(
              left: 16,
              right: 16,
              bottom: 16,
              child: GlassSurface(
                radius: 28,
                blurSigma: 18,
                color: AppColors.glassSoft,
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Build your next iconic look',
                      style: textTheme.headlineSmall?.copyWith(color: AppColors.ink),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Describe a vibe, silhouette, or occasion and let the backend return grounded outfit recommendations.',
                      style: textTheme.bodyMedium?.copyWith(color: AppColors.ink.withValues(alpha: 0.82)),
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

class _ResultSection extends StatelessWidget {
  const _ResultSection({required this.controller, required this.userId, required this.token});

  final StylistController controller;
  final String userId;
  final String token;

  @override
  Widget build(BuildContext context) {
    final result = controller.result;
    final textTheme = Theme.of(context).textTheme;

    if (controller.state == StylistViewState.loading) {
      return const GlassSurface(
        radius: 28,
        blurSigma: 16,
        child: Center(
          child: Padding(
            padding: EdgeInsets.all(14),
            child: CircularProgressIndicator(),
          ),
        ),
      );
    }

    if (result == null) {
      return GlassSurface(
        radius: 28,
        blurSigma: 16,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Your stylist board', style: textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(
              'Your summary, outfit ideas, and product reasoning will appear here after a successful request.',
              style: textTheme.bodyMedium,
            ),
          ],
        ),
      );
    }

    if (controller.state == StylistViewState.noMatch) {
      return GlassSurface(
        radius: 28,
        blurSigma: 16,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('No match found', style: textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(result.message ?? 'No eligible products were found.'),
            const SizedBox(height: 10),
            const GlassPill(label: 'Publish products + embed first', icon: Icons.info_outline_rounded),
          ],
        ),
      );
    }

    return Column(
      children: [
        GlassSurface(
          radius: 30,
          blurSigma: 18,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(child: Text('Style summary', style: textTheme.titleLarge)),
                  const GlassPill(label: 'Insight', icon: Icons.insights_rounded),
                ],
              ),
              const SizedBox(height: 10),
              if (result.analysis.styleMatch.isNotEmpty)
                Text(result.analysis.styleMatch, style: textTheme.bodyLarge),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _MetaPill(label: 'Body', value: result.analysis.bodyShape.isEmpty ? 'Not set' : result.analysis.bodyShape),
                  _MetaPill(label: 'Tone', value: result.analysis.skinTone.isEmpty ? 'Not set' : result.analysis.skinTone),
                  _MetaPill(label: 'Products', value: '${result.retrieval.productCount}'),
                  _MetaPill(label: 'Rules', value: '${result.retrieval.fashionRuleCount}'),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        for (final outfit in result.outfits) ...[
          _OutfitCard(controller: controller, outfit: outfit, userId: userId, token: token),
          const SizedBox(height: 14),
        ],
      ],
    );
  }
}

class _OutfitCard extends StatelessWidget {
  const _OutfitCard({required this.controller, required this.outfit, required this.userId, required this.token});

  final StylistController controller;
  final StylistOutfit outfit;
  final String userId;
  final String token;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return GlassSurface(
      radius: 30,
      blurSigma: 18,
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: SizedBox(
              height: 214,
              width: double.infinity,
              child: outfit.items.isEmpty
                  ? Container(color: AppColors.elevated)
                  : Stack(
                      fit: StackFit.expand,
                      children: [
                        Image.network(
                          outfit.items.first.product.imageUrl,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => const _ProductImageFallback(),
                        ),
                        DecoratedBox(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [
                                Colors.transparent,
                                Colors.black.withValues(alpha: 0.05),
                                Colors.black.withValues(alpha: 0.38),
                              ],
                            ),
                          ),
                        ),
                        Positioned(
                          top: 12,
                          right: 12,
                          child: _ScoreBadge(score: outfit.score),
                        ),
                      ],
                    ),
            ),
          ),
          const SizedBox(height: 14),
          Text(
            outfit.title.isEmpty ? 'Recommended Outfit' : outfit.title,
            style: textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          if (outfit.whyItMatches.isNotEmpty)
            Text(outfit.whyItMatches, style: textTheme.bodyMedium?.copyWith(color: AppColors.ink.withValues(alpha: 0.85))),
          const SizedBox(height: 12),
          for (final item in outfit.items) ...[
            _OutfitItemTile(item: item),
            const SizedBox(height: 10),
          ],
          if (outfit.fitWarnings.isNotEmpty) ...[
            Text('Fit warnings', style: textTheme.titleMedium),
            const SizedBox(height: 6),
            ...outfit.fitWarnings.map((warning) => Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Text(warning, style: textTheme.bodyMedium),
                )),
            const SizedBox(height: 10),
          ],
          if (outfit.fashionTips.isNotEmpty) ...[
            Text('Fashion tips', style: textTheme.titleMedium),
            const SizedBox(height: 6),
            ...outfit.fashionTips.map((tip) => Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Text(tip, style: textTheme.bodyMedium),
                )),
            const SizedBox(height: 10),
          ],
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              OutlinedButton.icon(
                onPressed: controller.isSubmittingFeedback
                    ? null
                    : () => controller.submitFeedback(userId: userId, outfit: outfit, eventType: 'liked', token: token),
                icon: const Icon(Icons.thumb_up_alt_outlined, size: 18),
                label: const Text('Liked'),
              ),
              OutlinedButton.icon(
                onPressed: controller.isSubmittingFeedback
                    ? null
                    : () => controller.submitFeedback(userId: userId, outfit: outfit, eventType: 'disliked', token: token),
                icon: const Icon(Icons.thumb_down_alt_outlined, size: 18),
                label: const Text('Disliked'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MetaPill extends StatelessWidget {
  const _MetaPill({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return GlassSurface(
      radius: 999,
      blurSigma: 14,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      shadowOpacity: 0.35,
      child: RichText(
        text: TextSpan(
          style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.muted),
          children: [
            TextSpan(text: '$label: '),
            TextSpan(
              text: value,
              style: const TextStyle(color: AppColors.ink, fontWeight: FontWeight.w700),
            ),
          ],
        ),
      ),
    );
  }
}

class _ScoreBadge extends StatelessWidget {
  const _ScoreBadge({required this.score});

  final int score;

  @override
  Widget build(BuildContext context) {
    return GlassPill(
      label: '$score/100',
      icon: Icons.star_rounded,
    );
  }
}

class _OutfitItemTile extends StatelessWidget {
  const _OutfitItemTile({required this.item});

  final StylistOutfitItem item;

  @override
  Widget build(BuildContext context) {
    final product = item.product;

    return GlassSurface(
      radius: 22,
      blurSigma: 14,
      color: AppColors.glassSoft,
      shadowOpacity: 0.28,
      padding: const EdgeInsets.all(10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: SizedBox(
              width: 84,
              height: 102,
              child: product.imageUrl.isNotEmpty
                  ? Image.network(
                      product.imageUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => const _ProductImageFallback(compact: true),
                    )
                  : const _ProductImageFallback(compact: true),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(product.name, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 4),
                Text(
                  '${product.category} • ${product.price.toStringAsFixed(0)} VND',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.ink.withValues(alpha: 0.72)),
                ),
                if (product.shopName.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(product.shopName, style: Theme.of(context).textTheme.bodySmall),
                ],
                const SizedBox(height: 8),
                Text(item.reason, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.ink)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ProductImageFallback extends StatelessWidget {
  const _ProductImageFallback({this.compact = false});

  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: double.infinity,
      color: AppColors.elevated,
      alignment: Alignment.center,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.image_not_supported_outlined),
          if (!compact) ...[
            const SizedBox(height: 8),
            const Text('Image unavailable on this platform'),
          ],
        ],
      ),
    );
  }
}

