interface CustomWebAppProps {
  url: string;
  name: string;
}

export default function CustomWebApp({ url, name }: CustomWebAppProps) {
  return (
    <div className="w-full h-full bg-white">
      <iframe
        src={url}
        title={name}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
    </div>
  );
}
