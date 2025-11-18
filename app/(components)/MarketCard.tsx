"use client";

interface Candidate {
  name: string;
  odds: number;
}

interface MarketCardProps {
  platform: "polymarket" | "kalshi";
  title: string;
  candidates: Candidate[];
  volume: string;
  image: string;
  url: string;
}

export function MarketCard({
  platform,
  title,
  candidates,
  volume,
  image,
  url,
}: MarketCardProps) {
  const platformLogo =
    platform === "polymarket"
      ? "/prediction-market/market-logos/polymarket.png"
      : "/prediction-market/market-logos/kalshi.png";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-[#E5E5E5]"
    >
      <div className="grid grid-cols-2 h-full min-h-[300px]">
        {/* Left Side - Info */}
        <div className="p-6 flex flex-col justify-between border-r border-[#E5E5E5]">
          {/* Title with double underline */}
          <div>
            <h3 className="text-lg font-semibold uppercase mb-2 text-black">
              {title}
            </h3>
            <div className="border-t-2 border-double border-black w-full mb-4"></div>

            {/* Candidates */}
            <div className="space-y-4">
              {candidates.map((candidate, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium uppercase text-black">
                      {candidate.name}
                    </span>
                    <span className="text-sm font-bold text-black">
                      {candidate.odds}%
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="flex-1 py-1.5 bg-green-500 text-white text-xs font-medium rounded hover:bg-green-600 transition-colors"
                      onClick={(e) => e.preventDefault()}
                    >
                      YES
                    </button>
                    <button
                      className="flex-1 py-1.5 bg-red-400 text-white text-xs font-medium rounded hover:bg-red-500 transition-colors"
                      onClick={(e) => e.preventDefault()}
                    >
                      NO
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Logo and Volume */}
          <div className="flex items-center justify-between mt-6">
            <img
              src={platformLogo}
              alt={platform}
              className="h-6 w-auto"
            />
            <span className="text-xs text-gray-500 uppercase">{volume}</span>
          </div>
        </div>

        {/* Right Side - Image (Landscape) */}
        <div className="relative bg-black">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </a>
  );
}
