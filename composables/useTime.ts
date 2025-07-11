export const useTime = () => {
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) {
      return `${seconds} secs ago`;
    }

    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} mins ago`;
    }

    const hours = Math.round(minutes / 60);
    if (hours < 24) {
      return `${hours} hours ago`;
    }

    const days = Math.round(hours / 24);
    return `${days} days ago`;
  };

  return { formatRelativeTime };
}; 