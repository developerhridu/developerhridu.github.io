interface LinkedInEmbedProps {
  activityId: string;
}

export default function LinkedInEmbed({ activityId }: LinkedInEmbedProps) {
  return (
    <div className="my-6 flex justify-center">
      <iframe
        src={`https://www.linkedin.com/embed/feed/update/urn:li:activity:${activityId}`}
        height="600"
        width="504"
        title="Embedded LinkedIn post"
        allowFullScreen
        loading="lazy"
        className="max-w-full rounded-xl border border-border"
      />
    </div>
  );
}
