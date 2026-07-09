import RepositoryCard from "./RepositoryCard";
import AddRepository from "./AddRepository";

const repositories = [
  { name: "UBS Server", owner: "granjur", repo: "ubs-server" },
  { name: "Badar HMS", owner: "granjur", repo: "badar-hms" },
  { name: "QuranFlow API", owner: "granjur", repo: "quranflow-api" },
  { name: "UBS Doc", owner: "Aashir-Adnan", repo: "UBS-Doc" },
];

export default function RepositoryGrid({
  onSelectRepository,
  searchQuery = "",
}) {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredRepositories = normalizedQuery
    ? repositories.filter((repo) =>
        [repo.name, repo.owner, repo.repo]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery),
      )
    : repositories;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {filteredRepositories.map((repo, idx) => (
        <RepositoryCard
          key={repo.name}
          repository={repo}
          onClick={() => onSelectRepository(repo)}
          index={idx}
        />
      ))}
      <AddRepository />
    </div>
  );
}
