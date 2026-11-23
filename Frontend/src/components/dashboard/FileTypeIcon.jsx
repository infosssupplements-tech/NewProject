const iconByType = {
  pdf: "pdf.svg",
  doc: "word.svg",
  docx: "word.svg",
  txt: "txt.svg",
};

export default function FileTypeIcon({ type }) {
  const extension = String(type || "").toLowerCase().replace(/^\./, "");
  const icon = iconByType[extension] || "file.svg";

  return <img className="workspace-file-type-image" src={`/file-types/${icon}`} alt="" aria-hidden="true" draggable="false" />;
}
