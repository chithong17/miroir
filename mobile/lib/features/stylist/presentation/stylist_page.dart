import 'package:flutter/material.dart';

import '../../../core/app/app_session_scope.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/glass_pill.dart';
import '../../../shared/widgets/glass_surface.dart';
import '../../../shared/widgets/miroir_button.dart';
import '../../../shared/widgets/section_card.dart';
import '../../../shared/widgets/surface_icon_button.dart';
import '../data/stylist_models.dart';
import 'controllers/stylist_controller.dart';

class StylistPage extends StatefulWidget {
  const StylistPage({super.key});

  @override
  State<StylistPage> createState() => _StylistPageState();
}

class _StylistPageState extends State<StylistPage> {
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

  void _usePromptSuggestion(String value) {
    setState(() {
      _promptController.text = value;
      _promptController.selection =
          TextSelection.collapsed(offset: value.length);
    });
  }

  Future<void> _submit() async {
    final session = AppSessionScope.of(context);
    if (!session.isSignedIn) {
      session.openLogin();
      return;
    }

    final form = _formKey.currentState;
    if (form == null || !form.validate()) return;

    await _controller.submit(
      StylistRequest(
        prompt: _promptController.text,
        userId: _userIdController.text.trim().isEmpty
            ? session.currentUser?.id ?? ''
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
                  Color(0xFFF9FBF3),
                  AppColors.canvas,
                  AppColors.canvasStrong
                ],
              ),
            ),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 22, 20, 132),
              children: [
                Row(
                  children: [
                    SurfaceIconButton(
                      icon: Icons.arrow_back_ios_new_rounded,
                      onPressed: () => Navigator.of(context).maybePop(),
                    ),
                    Expanded(
                      child: Center(
                        child: Text('AI Stylist', style: textTheme.titleLarge),
                      ),
                    ),
                    const GlassPill(
                        label: 'Live', icon: Icons.auto_awesome_rounded),
                  ],
                ),
                const SizedBox(height: 20),
                const _StylistHero(),
                const SizedBox(height: 24),
                Form(
                  key: _formKey,
                  child: Column(
                    children: [
                      SectionCard(
                        radius: 30,
                        color: AppColors.surface,
                        borderColor: AppColors.line,
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  width: 52,
                                  height: 52,
                                  decoration: BoxDecoration(
                                    color: AppColors.accentSoft,
                                    borderRadius: BorderRadius.circular(18),
                                  ),
                                  child: const Icon(Icons.edit_outlined),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text('Describe the look',
                                          style: textTheme.titleLarge),
                                      const SizedBox(height: 4),
                                      Text(
                                        'Share your vibe, silhouette, or occasion.',
                                        style: textTheme.bodyMedium
                                            ?.copyWith(color: AppColors.muted),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 20),
                            TextFormField(
                              controller: _promptController,
                              minLines: 4,
                              maxLines: 5,
                              textCapitalization: TextCapitalization.sentences,
                              decoration: const InputDecoration(
                                hintText: 'Describe your look...',
                                alignLabelWithHint: true,
                                suffixIcon: Padding(
                                  padding: EdgeInsets.only(bottom: 12),
                                  child: Icon(Icons.auto_awesome_rounded),
                                ),
                              ),
                              validator: (value) {
                                if (value == null || value.trim().isEmpty) {
                                  return 'Tell the stylist what you are looking for.';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 16),
                            Wrap(
                              alignment: WrapAlignment.center,
                              spacing: 10,
                              runSpacing: 10,
                              children: [
                                _PromptSuggestion(
                                  label: 'Date night',
                                  icon: Icons.calendar_month_outlined,
                                  onTap: () => _usePromptSuggestion(
                                      'A refined date night look with elegant layers and warm neutral colors.'),
                                ),
                                _PromptSuggestion(
                                  label: 'Weekend brunch',
                                  icon: Icons.coffee_outlined,
                                  onTap: () => _usePromptSuggestion(
                                      'A relaxed weekend brunch look that feels polished and comfortable.'),
                                ),
                                _PromptSuggestion(
                                  label: 'Office',
                                  icon: Icons.business_center_outlined,
                                  onTap: () => _usePromptSuggestion(
                                      'A modern office outfit with clean tailoring and versatile pieces.'),
                                ),
                                _PromptSuggestion(
                                  label: 'Vacation',
                                  icon: Icons.flight_takeoff_outlined,
                                  onTap: () => _usePromptSuggestion(
                                      'A light vacation look for warm weather and a full day of walking.'),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      SectionCard(
                        radius: 26,
                        color: AppColors.surface,
                        borderColor: AppColors.line,
                        padding: EdgeInsets.zero,
                        child: Theme(
                          data: Theme.of(context)
                              .copyWith(dividerColor: Colors.transparent),
                          child: ExpansionTile(
                            tilePadding: const EdgeInsets.symmetric(
                                horizontal: 18, vertical: 8),
                            childrenPadding:
                                const EdgeInsets.fromLTRB(18, 0, 18, 18),
                            leading: Container(
                              width: 46,
                              height: 46,
                              decoration: BoxDecoration(
                                color: AppColors.accentSoft,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: const Icon(Icons.person_outline_rounded),
                            ),
                            title: const Text('Optional profile'),
                            subtitle: const Text(
                                'Budget, shape, tone and style preferences'),
                            children: [
                              TextFormField(
                                controller: _userIdController,
                                decoration:
                                    const InputDecoration(labelText: 'User ID'),
                              ),
                              const SizedBox(height: 12),
                              DropdownButtonFormField<String>(
                                initialValue: _gender,
                                decoration:
                                    const InputDecoration(labelText: 'Gender'),
                                items: const [
                                  DropdownMenuItem(
                                      value: '', child: Text('Any')),
                                  DropdownMenuItem(
                                      value: 'female', child: Text('Female')),
                                  DropdownMenuItem(
                                      value: 'male', child: Text('Male')),
                                  DropdownMenuItem(
                                      value: 'unisex', child: Text('Unisex')),
                                ],
                                onChanged: (value) =>
                                    setState(() => _gender = value ?? ''),
                              ),
                              const SizedBox(height: 12),
                              TextFormField(
                                controller: _skinToneController,
                                decoration: const InputDecoration(
                                    labelText: 'Skin tone'),
                              ),
                              const SizedBox(height: 12),
                              TextFormField(
                                controller: _bodyShapeController,
                                decoration: const InputDecoration(
                                    labelText: 'Body shape'),
                              ),
                              const SizedBox(height: 12),
                              TextFormField(
                                controller: _stylePreferencesController,
                                decoration: const InputDecoration(
                                  labelText: 'Style preferences',
                                  hintText: 'Minimalist, elegant, monochrome',
                                ),
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Expanded(
                                    child: TextFormField(
                                      controller: _budgetMinController,
                                      keyboardType:
                                          const TextInputType.numberWithOptions(
                                              decimal: true),
                                      decoration: const InputDecoration(
                                          labelText: 'Budget min'),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: TextFormField(
                                      controller: _budgetMaxController,
                                      keyboardType:
                                          const TextInputType.numberWithOptions(
                                              decimal: true),
                                      decoration: const InputDecoration(
                                          labelText: 'Budget max'),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              TextFormField(
                                controller: _feedbackController,
                                maxLines: 3,
                                decoration: const InputDecoration(
                                    labelText: 'Feedback or notes'),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                      MiroirButton(
                        label: _controller.state == StylistViewState.loading
                            ? 'Generating...'
                            : 'Generate outfits',
                        onPressed: _controller.state == StylistViewState.loading
                            ? null
                            : _submit,
                        icon: Icons.auto_awesome_rounded,
                      ),
                      const SizedBox(height: 14),
                      const _PrivacyNotice(),
                    ],
                  ),
                ),
                if (_controller.feedbackMessage.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  GlassSurface(
                      radius: 24, child: Text(_controller.feedbackMessage)),
                ],
                if (_controller.errorMessage.isNotEmpty &&
                    _controller.state == StylistViewState.error) ...[
                  const SizedBox(height: 16),
                  GlassSurface(
                    radius: 24,
                    color: AppColors.dangerSoft,
                    borderColor: const Color(0xFFFFD1D1),
                    child: Text(
                      _controller.errorMessage,
                      style: const TextStyle(color: Colors.redAccent),
                    ),
                  ),
                ],
                const SizedBox(height: 20),
                _ResultSection(
                  controller: _controller,
                  userId: AppSessionScope.of(context).currentUser?.id ??
                      _userIdController.text,
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

class _StylistHero extends StatelessWidget {
  const _StylistHero();

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(32),
      child: SizedBox(
        height: 390,
        child: Stack(
          fit: StackFit.expand,
          children: [
            Image.asset(
              'assets/images/stylist.png',
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) =>
                  Container(color: AppColors.elevated),
            ),
            DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                  colors: [
                    AppColors.ink.withValues(alpha: 0.78),
                    AppColors.ink.withValues(alpha: 0.34),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Your style,\nreimagined',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 38,
                      fontWeight: FontWeight.w800,
                      height: 1.04,
                    ),
                  ),
                  const SizedBox(height: 14),
                  const SizedBox(
                    width: 244,
                    child: Text(
                      'Describe your vibe and receive grounded outfit ideas tailored for you.',
                      style: TextStyle(
                          color: Colors.white, fontSize: 16, height: 1.45),
                    ),
                  ),
                  const SizedBox(height: 18),
                  const GlassPill(
                      label: 'Curated by AI', icon: Icons.auto_awesome_rounded),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PromptSuggestion extends StatelessWidget {
  const _PromptSuggestion(
      {required this.label, required this.icon, required this.onTap});

  final String label;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.accentSoft,
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Container(
          height: 48,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.line),
            borderRadius: BorderRadius.circular(999),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 18, color: AppColors.ink),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  label,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                      color: AppColors.ink, fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PrivacyNotice extends StatelessWidget {
  const _PrivacyNotice();

  @override
  Widget build(BuildContext context) {
    return const Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(Icons.verified_user_outlined,
            size: 18, color: AppColors.accentStrong),
        SizedBox(width: 8),
        Text('Your inputs are private and secure'),
      ],
    );
  }
}

class _ResultSection extends StatelessWidget {
  const _ResultSection(
      {required this.controller, required this.userId, required this.token});

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
        child: Row(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: AppColors.elevated,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Icon(Icons.auto_awesome_rounded,
                  color: AppColors.accentStrong),
            ),
            const SizedBox(width: 16),
            Expanded(
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
            const GlassPill(
                label: 'Publish products + update AI first',
                icon: Icons.info_outline_rounded),
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
                  Expanded(
                      child:
                          Text('Style summary', style: textTheme.titleLarge)),
                  const GlassPill(
                      label: 'Insight', icon: Icons.insights_rounded),
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
                  _MetaPill(
                      label: 'Body',
                      value: result.analysis.bodyShape.isEmpty
                          ? 'Not set'
                          : result.analysis.bodyShape),
                  _MetaPill(
                      label: 'Tone',
                      value: result.analysis.skinTone.isEmpty
                          ? 'Not set'
                          : result.analysis.skinTone),
                  _MetaPill(
                      label: 'Products',
                      value: '${result.retrieval.productCount}'),
                  _MetaPill(
                      label: 'Rules',
                      value: '${result.retrieval.fashionRuleCount}'),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        for (final outfit in result.outfits) ...[
          _OutfitCard(
              controller: controller,
              outfit: outfit,
              userId: userId,
              token: token),
          const SizedBox(height: 14),
        ],
      ],
    );
  }
}

class _OutfitCard extends StatelessWidget {
  const _OutfitCard(
      {required this.controller,
      required this.outfit,
      required this.userId,
      required this.token});

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
                          errorBuilder: (_, __, ___) =>
                              const _ProductImageFallback(),
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
            Text(outfit.whyItMatches,
                style: textTheme.bodyMedium
                    ?.copyWith(color: AppColors.ink.withValues(alpha: 0.85))),
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
                    : () => controller.submitFeedback(
                        userId: userId,
                        outfit: outfit,
                        eventType: 'liked',
                        token: token),
                icon: const Icon(Icons.thumb_up_alt_outlined, size: 18),
                label: const Text('Liked'),
              ),
              OutlinedButton.icon(
                onPressed: controller.isSubmittingFeedback
                    ? null
                    : () => controller.submitFeedback(
                        userId: userId,
                        outfit: outfit,
                        eventType: 'disliked',
                        token: token),
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
          style: Theme.of(context)
              .textTheme
              .bodySmall
              ?.copyWith(color: AppColors.muted),
          children: [
            TextSpan(text: '$label: '),
            TextSpan(
              text: value,
              style: const TextStyle(
                  color: AppColors.ink, fontWeight: FontWeight.w700),
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
                      errorBuilder: (_, __, ___) =>
                          const _ProductImageFallback(compact: true),
                    )
                  : const _ProductImageFallback(compact: true),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(product.name,
                    style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 4),
                Text(
                  '${product.category}  ${product.price.toStringAsFixed(0)} VND',
                  style: Theme.of(context)
                      .textTheme
                      .bodySmall
                      ?.copyWith(color: AppColors.ink.withValues(alpha: 0.72)),
                ),
                if (product.shopName.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(product.shopName,
                      style: Theme.of(context).textTheme.bodySmall),
                ],
                const SizedBox(height: 8),
                Text(item.reason,
                    style: Theme.of(context)
                        .textTheme
                        .bodyMedium
                        ?.copyWith(color: AppColors.ink)),
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
