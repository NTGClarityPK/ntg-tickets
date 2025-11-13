// Utility function to get user initials for avatar
export function getUserInitials(name: string): string {
  const nameParts = name.split(' ').filter((n: string) => n.length > 0);
  if (nameParts.length === 0) return '';
  
  const getInitial = (name: string) => {
    if (name.includes('-')) {
      const hyphenIndex = name.indexOf('-');
      return name[hyphenIndex + 1] || name[0];
    }
    return name[0];
  };
  
  if (nameParts.length === 1) return getInitial(nameParts[0]).toUpperCase();
  return getInitial(nameParts[0]).toUpperCase() + getInitial(nameParts[nameParts.length - 1]).toUpperCase();
}

