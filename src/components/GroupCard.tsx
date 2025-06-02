import React from 'react';
import { Group } from '../types';
import { Users } from 'lucide-react';

interface GroupCardProps {
  group: Group;
  onClick: () => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ group, onClick }) => {
  // Function to generate a random pastel color based on group name
  const generateColorFromName = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate pastel color
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 80%)`;
  };

  const bgColor = generateColorFromName(group.groupName);
  
  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div 
        className="h-24 flex items-center justify-center p-4"
        style={{ backgroundColor: bgColor }}
      >
        <div className="bg-white/30 backdrop-blur-sm rounded-full p-3">
          <Users className="h-10 w-10 text-gray-800" />
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate">
          {group.groupName}
        </h3>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{group.members.length} members</span>
          <div className="bg-gray-100 px-2 py-1 rounded text-xs">
            Code: {group.groupCode}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupCard;