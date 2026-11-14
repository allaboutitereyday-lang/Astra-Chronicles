export function generateStaticParams() {
  return [
    { storyId: "astra-chronicles" },
    { storyId: "neon-eclipse" },
    { storyId: "sovereign-spire" },
    { storyId: "port-solaris" },
    { storyId: "starfall-labyrinth" },
  ];
}

export default function StoryPlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

