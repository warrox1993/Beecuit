export function VideoEmbed({
  provider,
  videoId,
}: {
  provider: "youtube" | "vimeo";
  videoId: string;
}) {
  const src =
    provider === "youtube"
      ? `https://www.youtube.com/embed/${videoId}`
      : `https://player.vimeo.com/video/${videoId}`;
  return (
    <div className="my-6 aspect-video">
      <iframe
        src={src}
        title={`${provider} video ${videoId}`}
        loading="lazy"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        className="h-full w-full rounded"
      />
    </div>
  );
}
