"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
export default function PdfUpload() {
  const t = useTranslations("Portal"),
    [file, setFile] = useState(null),
    [url, setUrl] = useState(""),
    [error, setError] = useState(false),
    generation = useRef(0),
    input = useRef(null);
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  function remove() {
    generation.current++;
    setFile(null);
    setUrl("");
    if (input.current) input.current.value = "";
  }
  async function select(event) {
    const value = event.target.files?.[0],
      attempt = ++generation.current;
    setError(false);
    setFile(null);
    setUrl("");
    if (!value) return;
    const signature = new TextDecoder().decode(
      await value.slice(0, 5).arrayBuffer(),
    );
    if (attempt !== generation.current) return;
    if (
      value.size > 10 * 1024 * 1024 ||
      !value.name.toLowerCase().endsWith(".pdf") ||
      signature !== "%PDF-"
    ) {
      setError(true);
      if (input.current) input.current.value = "";
      return;
    }
    setUrl(URL.createObjectURL(value));
    setFile(value);
  }
  return (
    <section className="mt-10 rounded-2xl border border-border bg-canvas p-6">
      <label className="block font-semibold">
        {t("previewPdf")}
        <input
          ref={input}
          type="file"
          accept="application/pdf,.pdf"
          onChange={select}
          className="mt-4 block max-w-full"
        />
      </label>
      <p className="mt-3 text-sm text-muted">{t("localOnly")}</p>
      {error && (
        <p role="alert" className="mt-3">
          {t("invalidPdf")}
        </p>
      )}
      {file && url && (
        <div className="mt-4 flex flex-wrap gap-4">
          <a href={url} target="_blank" rel="noreferrer" className="font-bold transition-opacity hover:opacity-60">
            {t("view")}
          </a>
          <a href={url} download={file.name} className="font-bold transition-opacity hover:opacity-60">
            {t("download")}
          </a>
          <button type="button" onClick={remove} className="font-bold transition-opacity hover:opacity-60">
            {t("remove")}
          </button>
        </div>
      )}
    </section>
  );
}
