import { useCallback, useId, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { useTranslation } from "react-i18next";
import { Button } from "@freetsy/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@freetsy/ui/components/dialog";
import { Field, FieldTitle } from "@freetsy/ui/components/field";
import { Slider } from "@freetsy/ui/components/slider";
import { cn } from "@freetsy/ui/lib/utils";

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

const CROP_ZOOM_STEP = 0.05;

export function CoverCropperModal({
  imageUrl,
  aspect = 1,
  isProcessing,
  onConfirm,
  onCancel,
}: {
  imageUrl: string;
  aspect?: number;
  isProcessing: boolean;
  onConfirm: (crop: Area) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const zoomLabelId = useId();
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const handleCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next && !isProcessing) onCancel();
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{t("cropper.title")}</DialogTitle>
          <DialogDescription>{t("cropper.hint")}</DialogDescription>
        </DialogHeader>

        <div
          className={cn(
            "relative aspect-square w-full overflow-hidden border border-tertiary bg-primary",
          )}
        >
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>

        <Field orientation="horizontal" className={cn("gap-m")}>
          <FieldTitle id={zoomLabelId} className={cn("flex-none")}>
            {t("cropper.zoom")}
          </FieldTitle>
          <Slider
            value={[zoom]}
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={CROP_ZOOM_STEP}
            aria-labelledby={zoomLabelId}
            onValueChange={([next]) => setZoom(next)}
            className={cn("flex-1")}
          />
        </Field>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
            className={cn("flex-1")}
          >
            {t("cropper.cancel")}
          </Button>
          <Button
            onClick={() => croppedAreaPixels && onConfirm(croppedAreaPixels)}
            disabled={!croppedAreaPixels || isProcessing}
            className={cn("flex-1")}
          >
            {isProcessing ? t("cropper.processing") : t("cropper.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
