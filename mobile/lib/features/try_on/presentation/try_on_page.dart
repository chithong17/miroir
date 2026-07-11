import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/app/app_session_scope.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/models/local_image_data.dart';
import '../../../shared/widgets/miroir_button.dart';
import '../../../shared/widgets/section_card.dart';
import '../../../shared/widgets/surface_icon_button.dart';
import '../../marketplace/data/catalog_models.dart';
import '../../payments/presentation/premium_paywall_sheet.dart';
import 'controllers/try_on_controller.dart';

class TryOnPage extends StatefulWidget {
  const TryOnPage({
    super.key,
    this.prefilledProduct,
  });

  final CatalogProduct? prefilledProduct;

  @override
  State<TryOnPage> createState() => _TryOnPageState();
}

class _TryOnPageState extends State<TryOnPage> {
  static const _previewImageUrl = 'https://picsum.photos/700/600?fashion-preview';

  final _picker = ImagePicker();
  final _controller = TryOnController();
  bool _didPrefill = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_didPrefill && widget.prefilledProduct != null) {
      _didPrefill = true;
      _controller.prefillFromCatalogProduct(widget.prefilledProduct!);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _pickImage(TryOnImageSlot slot) async {
    final file = await _picker.pickImage(source: ImageSource.gallery);
    if (file == null) {
      return;
    }

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

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return ListenableBuilder(
      listenable: _controller,
      builder: (context, _) {
        final session = AppSessionScope.of(context);
        final modeLabel = _controller.isCatalogTryOn
            ? 'Catalog product'
            : _controller.tryOnType == 'dress'
                ? 'Dress mode'
                : 'Upper / Lower mode';

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
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 120),
              children: [
                Row(
                  children: [
                    SurfaceIconButton(
                      icon: Icons.arrow_back_ios_new_rounded,
                      onPressed: Navigator.of(context).canPop()
                          ? () => Navigator.of(context).maybePop()
                          : null,
                    ),
                    const Spacer(),
                    Text('Virtual Try-On', style: textTheme.titleLarge),
                    const Spacer(),
                    const _HeaderStatus(label: 'Live'),
                  ],
                ),
                const SizedBox(height: 16),
                SectionCard(
                  radius: 30,
                  padding: EdgeInsets.zero,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ClipRRect(
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
                        child: SizedBox(
                          height: 210,
                          width: double.infinity,
                          child: _controller.modelImage == null
                              ? Stack(
                                  fit: StackFit.expand,
                                  children: [
                                    Image.network(
                                      _previewImageUrl,
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, __, ___) => Container(color: AppColors.elevated),
                                    ),
                                    DecoratedBox(
                                      decoration: BoxDecoration(
                                        gradient: LinearGradient(
                                          begin: Alignment.topCenter,
                                          end: Alignment.bottomCenter,
                                          colors: [
                                            Colors.transparent,
                                            Colors.black.withValues(alpha: 0.08),
                                            Colors.black.withValues(alpha: 0.38),
                                          ],
                                        ),
                                      ),
                                    ),
                                    Positioned(
                                      left: 16,
                                      right: 16,
                                      bottom: 16,
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                            decoration: BoxDecoration(
                                              color: Colors.white.withValues(alpha: 0.18),
                                              borderRadius: BorderRadius.circular(999),
                                            ),
                                            child: Text(
                                              modeLabel,
                                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12),
                                            ),
                                          ),
                                          const SizedBox(height: 10),
                                          const Text(
                                            'Build your studio preview',
                                            style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800),
                                          ),
                                          const SizedBox(height: 6),
                                          const Text(
                                            'Upload your photo and garments, then let the backend render the fitted result.',
                                            style: TextStyle(color: Colors.white70, height: 1.4),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                )
                              : Image.memory(_controller.modelImage!.bytes, fit: BoxFit.cover),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text('Mode', style: textTheme.titleMedium),
                                const Spacer(),
                                _StatusPill(label: modeLabel),
                              ],
                            ),
                            const SizedBox(height: 12),
                            SegmentedButton<String>(
                              segments: const [
                                ButtonSegment<String>(value: 'dress', label: Text('Dress')),
                                ButtonSegment<String>(value: 'upper_lower', label: Text('Upper / Lower')),
                              ],
                              selected: {_controller.tryOnType},
                              onSelectionChanged: _controller.isCatalogTryOn
                                  ? null
                                  : (selection) {
                                      _controller.setTryOnType(selection.first);
                                    },
                            ),
                            if (_controller.prefillLabel.isNotEmpty) ...[
                              const SizedBox(height: 14),
                              SectionCard(
                                radius: 20,
                                color: AppColors.accentSoft,
                                borderColor: Colors.transparent,
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                child: Row(
                                  children: [
                                    const Icon(Icons.checkroom_rounded, size: 18, color: AppColors.ink),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Text(
                                        'Prefilled garment: ${_controller.prefillLabel}',
                                        style: textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                            const SizedBox(height: 16),
                            Text('Your uploads', style: textTheme.titleMedium),
                            const SizedBox(height: 10),
                            _UploadCard(
                              title: 'Your Photo',
                              subtitle: 'Full-body model image',
                              image: _controller.modelImage,
                              onTap: () => _pickImage(TryOnImageSlot.model),
                            ),
                            const SizedBox(height: 12),
                            if (_controller.isCatalogTryOn)
                              _CatalogProductCard(product: _controller.catalogProduct!)
                            else if (_controller.tryOnType == 'dress')
                              _UploadCard(
                                title: 'Dress Image',
                                subtitle: 'Upload the dress product image',
                                image: _controller.dressImage,
                                onTap: () => _pickImage(TryOnImageSlot.dress),
                              )
                            else ...[
                              _UploadCard(
                                title: 'Upper Garment',
                                subtitle: 'Upload a top or jacket',
                                image: _controller.upperImage,
                                onTap: () => _pickImage(TryOnImageSlot.upper),
                              ),
                              const SizedBox(height: 12),
                              _UploadCard(
                                title: 'Lower Garment',
                                subtitle: 'Optional bottom garment',
                                image: _controller.lowerImage,
                                onTap: () => _pickImage(TryOnImageSlot.lower),
                              ),
                            ],
                            const SizedBox(height: 16),
                            MiroirButton(
                              label: _controller.state == TryOnViewState.creating
                                  ? 'Creating Task...'
                                  : _controller.state == TryOnViewState.polling
                                      ? 'Preparing Preview...'
                                      : 'Generate Try-On',
                              onPressed: _controller.isBusy
                                  ? null
                                  : () async {
                                      if (!session.isSignedIn) {
                                        session.openLogin();
                                        return;
                                      }
                                      if (session.isTryOnQuotaExhausted) {
                                        await showPremiumPaywall(
                                          context,
                                          session: session,
                                          reason: 'You have used all free try-on credits this month. Upgrade for unlimited Studio previews.',
                                        );
                                        return;
                                      }
                                      await _controller.submit(session.authToken);
                                      await session.refreshCurrentUser();
                                    },
                              icon: Icons.auto_awesome_outlined,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                if (_controller.errorMessage.isNotEmpty) ...[
                  const SizedBox(height: 14),
                  SectionCard(
                    radius: 24,
                    color: AppColors.dangerSoft,
                    borderColor: const Color(0xFFFFD1D1),
                    child: Row(
                      children: [
                        const Icon(Icons.info_outline_rounded, color: Color(0xFFD95D5D), size: 18),
                        const SizedBox(width: 10),
                        Expanded(child: Text(_controller.errorMessage)),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 14),
                _PreviewPanel(controller: _controller),
                if (_controller.state != TryOnViewState.idle) ...[
                  const SizedBox(height: 14),
                  MiroirButton(
                    label: 'Start New Try-On',
                    onPressed: _controller.isBusy ? null : _controller.reset,
                    icon: Icons.refresh_rounded,
                    isSecondary: true,
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }
}

class _HeaderStatus extends StatelessWidget {
  const _HeaderStatus({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.line),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: AppColors.ink,
              fontWeight: FontWeight.w700,
            ),
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.accentSoft,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: AppColors.ink,
              fontWeight: FontWeight.w700,
            ),
      ),
    );
  }
}

class _UploadCard extends StatelessWidget {
  const _UploadCard({
    required this.title,
    required this.subtitle,
    required this.image,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final LocalImageData? image;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(22),
      onTap: onTap,
      child: SectionCard(
        radius: 22,
        color: AppColors.panel,
        borderColor: Colors.transparent,
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: SizedBox(
                width: 78,
                height: 78,
                child: image == null
                    ? Container(
                        color: Colors.white,
                        child: const Icon(Icons.add_photo_alternate_outlined, color: AppColors.muted),
                      )
                    : Image.memory(image!.bytes, fit: BoxFit.cover),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 4),
                  Text(subtitle, style: Theme.of(context).textTheme.bodyMedium),
                ],
              ),
            ),
            Container(
              width: 38,
              height: 38,
              decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
              child: const Icon(Icons.arrow_forward_ios_rounded, size: 16),
            ),
          ],
        ),
      ),
    );
  }
}

class _CatalogProductCard extends StatelessWidget {
  const _CatalogProductCard({required this.product});

  final CatalogProduct product;

  @override
  Widget build(BuildContext context) {
    return SectionCard(
      radius: 22,
      color: AppColors.panel,
      borderColor: Colors.transparent,
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: SizedBox(
              width: 78,
              height: 78,
              child: product.imageUrl.isNotEmpty
                  ? Image.network(
                      product.imageUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(color: Colors.white),
                    )
                  : Container(color: Colors.white),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Catalog garment', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 4),
                Text(product.name, style: Theme.of(context).textTheme.bodyMedium),
                const SizedBox(height: 4),
                const Text('Backend will use this product by ID.'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
class _PreviewPanel extends StatelessWidget {
  const _PreviewPanel({required this.controller});

  final TryOnController controller;

  @override
  Widget build(BuildContext context) {
    Widget child;

    if (controller.state == TryOnViewState.completed && controller.resultUrl.isNotEmpty) {
      child = Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Final Preview', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 6),
          Text('Your generated result is ready to review.', style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(22),
            child: Image.network(
              controller.resultUrl,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => SelectableText(controller.resultUrl),
            ),
          ),
        ],
      );
    } else if (controller.state == TryOnViewState.polling) {
      child = const Column(
        children: [
          CircularProgressIndicator(),
          SizedBox(height: 12),
          Text('Waiting for the backend to finish your preview...'),
        ],
      );
    } else if (controller.state == TryOnViewState.completedWithoutUrl) {
      child = const Text('The try-on task completed, but no image URL was returned.');
    } else if (controller.state == TryOnViewState.timedOut) {
      child = const Text('The try-on request timed out before a final image was returned.');
    } else if (controller.state == TryOnViewState.failed) {
      child = const Text('The try-on request did not complete successfully.');
    } else {
      child = Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Preview panel', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 6),
          const Text('Your generated try-on result will appear here after a successful request.'),
        ],
      );
    }

    return SectionCard(
      radius: 26,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (controller.taskId.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Text(
                'Task ${controller.taskId} • ${controller.taskStatus}',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ),
          child,
        ],
      ),
    );
  }
}
