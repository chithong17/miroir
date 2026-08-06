import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/app/app_session_scope.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/models/local_image_data.dart';
import '../../../shared/widgets/miroir_button.dart';
import '../../../shared/widgets/section_card.dart';
import '../../marketplace/data/catalog_models.dart';
import '../../marketplace/presentation/widgets/product_feedback_card.dart';
import 'controllers/try_on_controller.dart';

class TryOnPage extends StatefulWidget {
  const TryOnPage({
    super.key,
    this.prefilledProduct,
    this.controller,
    this.previewKey,
  });

  final CatalogProduct? prefilledProduct;
  final TryOnController? controller;
  final GlobalKey? previewKey;

  @override
  State<TryOnPage> createState() => _TryOnPageState();
}

class _TryOnPageState extends State<TryOnPage> {
  final _picker = ImagePicker();
  late final TryOnController _controller;
  bool _didPrefill = false;

  @override
  void initState() {
    super.initState();
    _controller = widget.controller ?? TryOnController.shared;
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_didPrefill && widget.prefilledProduct != null) {
      _didPrefill = true;
      _controller.prefillFromCatalogProduct(widget.prefilledProduct!);
    }
  }


  Future<void> _pickImage(TryOnImageSlot slot) async {
    final file = await _picker.pickImage(source: ImageSource.gallery);
    if (file == null) return;

    final bytes = await file.readAsBytes();
    _controller.setImage(
      slot,
      LocalImageData(
        name: file.name,
        bytes: bytes,
        mimeType: file.mimeType,
      ),
    );
  }

  Future<void> _submit() async {
    final session = AppSessionScope.of(context);
    if (!session.isSignedIn) {
      session.openLogin();
      return;
    }
    await _controller.submit(session.authToken);
    await session.refreshCurrentUser();
  }

  void _showHowItWorks() {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      backgroundColor: AppColors.surface,
      builder: (context) => Padding(
        padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text('How Studio works',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
            SizedBox(height: 16),
            _HowItWorksStep(
                number: '1', text: 'Upload a clear, full-body photo.'),
            SizedBox(height: 12),
            _HowItWorksStep(
                number: '2',
                text: 'Choose a garment or open Studio from a product.'),
            SizedBox(height: 12),
            _HowItWorksStep(
                number: '3',
                text: 'Generate your private virtual try-on preview.'),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return ListenableBuilder(
      listenable: _controller,
      builder: (context, _) {
        final modeLabel = _controller.isCatalogTryOn
            ? 'Catalog product'
            : _controller.tryOnType == 'dress'
                ? 'Dress mode'
                : 'Upper / Lower';

        return Material(
          color: AppColors.canvas,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 132),
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Try-On', style: textTheme.headlineMedium),
                        const SizedBox(height: 4),
                        Text(
                          'See how it looks on you',
                          style: textTheme.bodyLarge
                              ?.copyWith(color: AppColors.muted),
                        ),
                      ],
                    ),
                  ),
                  _HeaderChip(
                    icon: Icons.auto_awesome_rounded,
                    label: modeLabel,
                  ),
                ],
              ),
              const SizedBox(height: 24),
              _StudioHero(modeLabel: modeLabel),
              const SizedBox(height: 28),
              Row(
                children: [
                  Expanded(child: Text('Mode', style: textTheme.titleLarge)),
                  TextButton.icon(
                    onPressed: _showHowItWorks,
                    icon: const Icon(Icons.help_outline_rounded, size: 18),
                    label: const Text('How it works'),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _ModeCard(
                      title: 'Dress',
                      subtitle: 'Full outfit try-on',
                      icon: Icons.checkroom_outlined,
                      selected: _controller.tryOnType == 'dress',
                      enabled: !_controller.isCatalogTryOn,
                      onTap: () => _controller.setTryOnType('dress'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _ModeCard(
                      title: 'Upper / Lower',
                      subtitle: 'Top or bottom try-on',
                      icon: Icons.dry_cleaning_outlined,
                      selected: _controller.tryOnType == 'upper_lower',
                      enabled: !_controller.isCatalogTryOn,
                      onTap: () => _controller.setTryOnType('upper_lower'),
                    ),
                  ),
                ],
              ),
              if (_controller.prefillLabel.isNotEmpty) ...[
                const SizedBox(height: 16),
                _PrefilledGarmentCard(label: _controller.prefillLabel),
              ],
              const SizedBox(height: 28),
              Text('Your uploads', style: textTheme.titleLarge),
              const SizedBox(height: 12),
              _UploadGrid(
                controller: _controller,
                pickImage: _pickImage,
              ),
              const SizedBox(height: 20),
              MiroirButton(
                label: _controller.state == TryOnViewState.creating
                    ? 'Creating preview...'
                    : _controller.state == TryOnViewState.polling
                        ? 'Preparing preview...'
                        : 'Generate Try-On',
                onPressed: _controller.isBusy ? null : _submit,
                icon: Icons.auto_awesome_rounded,
              ),
              const SizedBox(height: 14),
              const _PrivacyNotice(),
              if (_controller.errorMessage.isNotEmpty) ...[
                const SizedBox(height: 20),
                _TryOnError(message: _controller.errorMessage),
              ],
              const SizedBox(height: 20),
              KeyedSubtree(
                key: widget.previewKey,
                child: _PreviewPanel(
                  controller: _controller,
                  prefilledProduct: widget.prefilledProduct,
                ),
              ),
              if (_controller.state != TryOnViewState.idle) ...[
                const SizedBox(height: 16),
                MiroirButton(
                  label: 'Start New Try-On',
                  onPressed: _controller.isBusy ? null : _controller.reset,
                  icon: Icons.refresh_rounded,
                  isSecondary: true,
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}

class _StudioHero extends StatelessWidget {
  const _StudioHero({required this.modeLabel});

  final String modeLabel;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(32),
      child: SizedBox(
        height: 300,
        child: Stack(
          fit: StackFit.expand,
          children: [
            Image.asset(
              'assets/images/try-on.png',
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
                    AppColors.ink.withValues(alpha: 0.20),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _HeroModePill(label: modeLabel),
                  const SizedBox(height: 18),
                  const Text(
                    'Studio preview',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 30,
                      fontWeight: FontWeight.w800,
                      height: 1.05,
                    ),
                  ),
                  const SizedBox(height: 10),
                  const SizedBox(
                    width: 218,
                    child: Text(
                      'Upload your photo and clothes, then see the perfect fit.',
                      style: TextStyle(color: Colors.white, height: 1.45),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HeaderChip extends StatelessWidget {
  const _HeaderChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(maxWidth: 152),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.accentSoft,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppColors.line),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 17, color: AppColors.ink),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              label,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }
}

class _HeroModePill extends StatelessWidget {
  const _HeroModePill({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.accentStrong,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style:
            const TextStyle(color: Colors.white, fontWeight: FontWeight.w800),
      ),
    );
  }
}

class _ModeCard extends StatelessWidget {
  const _ModeCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.selected,
    required this.enabled,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final bool selected;
  final bool enabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? AppColors.accentSoft : AppColors.surface,
      borderRadius: BorderRadius.circular(24),
      child: InkWell(
        onTap: enabled ? onTap : null,
        borderRadius: BorderRadius.circular(24),
        child: Ink(
          height: 112,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            border:
                Border.all(color: selected ? AppColors.moss : AppColors.line),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: const BoxDecoration(
                      color: AppColors.surface,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(icon, size: 20, color: AppColors.ink),
                  ),
                  const Spacer(),
                  if (selected)
                    const Icon(Icons.check_circle_rounded,
                        color: AppColors.accentStrong),
                ],
              ),
              const Spacer(),
              Text(title, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 2),
              Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
        ),
      ),
    );
  }
}

class _PrefilledGarmentCard extends StatelessWidget {
  const _PrefilledGarmentCard({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.accentSoft,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          const Icon(Icons.checkroom_rounded, color: AppColors.ink),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'Catalog garment: $label',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }
}

class _UploadGrid extends StatelessWidget {
  const _UploadGrid({required this.controller, required this.pickImage});

  final TryOnController controller;
  final Future<void> Function(TryOnImageSlot slot) pickImage;

  @override
  Widget build(BuildContext context) {
    final garmentTile = controller.isCatalogTryOn
        ? _CatalogUploadTile(product: controller.catalogProduct!)
        : controller.tryOnType == 'dress'
            ? _UploadTile(
                title: 'Dress image',
                subtitle: 'The clothing item you want to try',
                icon: Icons.checkroom_outlined,
                image: controller.dressImage,
                onTap: () => pickImage(TryOnImageSlot.dress),
              )
            : _UploadTile(
                title: 'Upper garment',
                subtitle: 'Upload a top or jacket',
                icon: Icons.dry_cleaning_outlined,
                image: controller.upperImage,
                onTap: () => pickImage(TryOnImageSlot.upper),
              );

    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _UploadTile(
                title: 'Your photo',
                subtitle: 'A clear full-body photo',
                icon: Icons.person_outline_rounded,
                image: controller.modelImage,
                onTap: () => pickImage(TryOnImageSlot.model),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(child: garmentTile),
          ],
        ),
        if (!controller.isCatalogTryOn &&
            controller.tryOnType == 'upper_lower') ...[
          const SizedBox(height: 12),
          _UploadTile(
            title: 'Lower garment',
            subtitle: 'Optional bottom garment',
            icon: Icons.checkroom_outlined,
            image: controller.lowerImage,
            onTap: () => pickImage(TryOnImageSlot.lower),
            compact: true,
          ),
        ],
      ],
    );
  }
}

class _UploadTile extends StatelessWidget {
  const _UploadTile({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.image,
    required this.onTap,
    this.compact = false,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final LocalImageData? image;
  final VoidCallback onTap;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final content = Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(24),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(24),
        child: Ink(
          height: compact ? 116 : 220,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: AppColors.line),
          ),
          child: compact
              ? _CompactUploadContent(
                  title: title, subtitle: subtitle, icon: icon, image: image)
              : _UploadTileContent(
                  title: title, subtitle: subtitle, icon: icon, image: image),
        ),
      ),
    );
    return content;
  }
}

class _UploadTileContent extends StatelessWidget {
  const _UploadTileContent({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.image,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final LocalImageData? image;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Expanded(
          child: Stack(
            children: [
              Center(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(18),
                  child: SizedBox(
                    width: 88,
                    height: 88,
                    child: image == null
                        ? Container(
                            color: AppColors.elevated,
                            child: Icon(icon, size: 40, color: AppColors.ink),
                          )
                        : Stack(
                            fit: StackFit.expand,
                            children: [
                              Image.memory(image!.bytes, fit: BoxFit.cover),
                              Align(
                                alignment: Alignment.bottomRight,
                                child: Material(
                                  color: Colors.white.withValues(alpha: 0.92),
                                  shape: const CircleBorder(),
                                  child: InkWell(
                                    customBorder: const CircleBorder(),
                                    onTap: () =>
                                        _showImagePreview(context, image!),
                                    child: const Padding(
                                      padding: EdgeInsets.all(7),
                                      child: Icon(Icons.open_in_full_rounded,
                                          size: 15),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                  ),
                ),
              ),
              const Align(
                alignment: Alignment.topRight,
                child: _RequiredPill(),
              ),
            ],
          ),
        ),
        Text(title,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleSmall),
        const SizedBox(height: 4),
        Text(
          subtitle,
          textAlign: TextAlign.center,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: Theme.of(context)
              .textTheme
              .bodySmall
              ?.copyWith(color: AppColors.muted),
        ),
      ],
    );
  }
}

class _CompactUploadContent extends StatelessWidget {
  const _CompactUploadContent({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.image,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final LocalImageData? image;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: SizedBox(
            width: 72,
            height: 72,
            child: image == null
                ? Container(
                    color: AppColors.elevated,
                    child: Icon(icon, color: AppColors.ink),
                  )
                : Image.memory(image!.bytes, fit: BoxFit.cover),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 4),
              Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
        ),
        const Icon(Icons.add_rounded, color: AppColors.ink),
      ],
    );
  }
}

void _showImagePreview(BuildContext context, LocalImageData image) {
  showDialog<void>(
    context: context,
    builder: (dialogContext) => Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.all(20),
      child: Stack(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(28),
            child: Container(
              color: AppColors.surface,
              constraints: BoxConstraints(
                maxHeight: MediaQuery.of(dialogContext).size.height * 0.78,
              ),
              padding: const EdgeInsets.all(12),
              child: Image.memory(image.bytes, fit: BoxFit.contain),
            ),
          ),
          Positioned(
            top: 10,
            right: 10,
            child: Material(
              color: Colors.white.withValues(alpha: 0.94),
              shape: const CircleBorder(),
              child: InkWell(
                customBorder: const CircleBorder(),
                onTap: () => Navigator.of(dialogContext).pop(),
                child: const Padding(
                  padding: EdgeInsets.all(10),
                  child: Icon(Icons.close_rounded),
                ),
              ),
            ),
          ),
        ],
      ),
    ),
  );
}

class _CatalogUploadTile extends StatelessWidget {
  const _CatalogUploadTile({required this.product});

  final CatalogProduct product;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 220,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.accentSoft,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.line),
      ),
      child: Column(
        children: [
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(18),
              child: SizedBox(
                width: 88,
                height: 88,
                child: product.imageUrl.isEmpty
                    ? Container(color: AppColors.surface)
                    : Image.network(
                        product.imageUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) =>
                            Container(color: AppColors.surface),
                      ),
              ),
            ),
          ),
          Text('Catalog item', style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: 4),
          Text(
            product.name,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}

class _RequiredPill extends StatelessWidget {
  const _RequiredPill();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.accentSoft,
        borderRadius: BorderRadius.circular(999),
      ),
      child: const Text(
        'Required',
        style: TextStyle(
            fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.ink),
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
        Text('Your images are private and secure'),
      ],
    );
  }
}

class _TryOnError extends StatelessWidget {
  const _TryOnError({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return SectionCard(
      radius: 22,
      color: AppColors.dangerSoft,
      borderColor: const Color(0xFFFFD1D1),
      child: Row(
        children: [
          const Icon(Icons.info_outline_rounded, color: Color(0xFFD95D5D)),
          const SizedBox(width: 12),
          Expanded(child: Text(message)),
        ],
      ),
    );
  }
}

class _PreviewPanel extends StatelessWidget {
  const _PreviewPanel({
    required this.controller,
    this.prefilledProduct,
  });

  final TryOnController controller;
  final CatalogProduct? prefilledProduct;

  @override
  Widget build(BuildContext context) {
    Widget content;
    if (controller.state == TryOnViewState.completed &&
        controller.resultUrl.isNotEmpty) {
      content = Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Your preview is ready',
              style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: Image.network(
              controller.resultUrl,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) =>
                  SelectableText(controller.resultUrl),
            ),
          ),
          if (prefilledProduct != null) ...[
            const SizedBox(height: 16),
            ProductFeedbackCard(product: prefilledProduct!, context: 'tryon'),
          ],
        ],
      );
    } else if (controller.state == TryOnViewState.polling ||
        controller.state == TryOnViewState.creating) {
      content = const _PreviewStatus(
        icon: Icons.auto_awesome_rounded,
        title: 'Creating your preview',
        message:
            'This may take a moment. Keep the app open while we prepare it.',
        loading: true,
      );
    } else if (controller.state == TryOnViewState.completedWithoutUrl) {
      content = const _PreviewStatus(
        icon: Icons.image_not_supported_outlined,
        title: 'Preview completed',
        message: 'The task completed, but no image was returned.',
      );
    } else if (controller.state == TryOnViewState.timedOut) {
      content = const _PreviewStatus(
        icon: Icons.schedule_outlined,
        title: 'Preview is taking longer',
        message: 'The request timed out before a final image was returned.',
      );
    } else if (controller.state == TryOnViewState.failed) {
      content = const _PreviewStatus(
        icon: Icons.error_outline_rounded,
        title: 'Preview was not created',
        message: 'Review your uploads and try again.',
      );
    } else {
      content = const _PreviewStatus(
        icon: Icons.visibility_outlined,
        title: 'Your preview will appear here',
        message: 'Choose a photo and garment, then generate your try-on.',
      );
    }

    return SectionCard(
      radius: 28,
      color: AppColors.surface,
      borderColor: AppColors.line,
      padding: const EdgeInsets.all(20),
      child: content,
    );
  }
}

class _PreviewStatus extends StatelessWidget {
  const _PreviewStatus({
    required this.icon,
    required this.title,
    required this.message,
    this.loading = false,
  });

  final IconData icon;
  final String title;
  final String message;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: const BoxDecoration(
              color: AppColors.elevated, shape: BoxShape.circle),
          child: loading
              ? const Padding(
                  padding: EdgeInsets.all(13),
                  child: CircularProgressIndicator(strokeWidth: 2.5),
                )
              : Icon(icon, color: AppColors.ink),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 4),
              Text(message, style: Theme.of(context).textTheme.bodyMedium),
            ],
          ),
        ),
      ],
    );
  }
}

class _HowItWorksStep extends StatelessWidget {
  const _HowItWorksStep({required this.number, required this.text});

  final String number;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: const BoxDecoration(
              color: AppColors.accentSoft, shape: BoxShape.circle),
          alignment: Alignment.center,
          child:
              Text(number, style: const TextStyle(fontWeight: FontWeight.w800)),
        ),
        const SizedBox(width: 12),
        Expanded(child: Text(text)),
      ],
    );
  }
}


