import styles from "./gallery-watermark.module.css";

// Display-only branding: never modifies the uploaded photo or intercepts controls.
export default function GalleryWatermark() {
  return <div className={styles.watermark} aria-hidden="true" data-gallery-watermark="mta" />;
}
