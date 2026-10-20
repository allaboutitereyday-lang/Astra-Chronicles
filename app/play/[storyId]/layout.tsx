export function generateStaticParams() {
  return [
    { storyId: "astra-chronicles" },
    { storyId: "neon-eclipse" },
  ];
}

export default function StoryPlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

