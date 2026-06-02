import { 
  Briefcase, 
  Dumbbell, 
  Sparkles, 
  Heart, 
  Moon, 
  Brain, 
  Zap, 
  Wind, 
  Salad, 
  CloudMoon, 
  Crown, 
  BookOpen, 
  Podcast, 
  FileText, 
  Check, 
  Plus, 
  Trash2, 
  HelpCircle, 
  Trophy, 
  Play, 
  Pause, 
  X,
  Lock,
  ChevronRight,
  Sparkle
} from 'lucide-react';

interface IconProps {
  name: string;
  className?: string;
  size?: number;
}

export function Icon({ name, className = '', size = 20 }: IconProps) {
  const icons: { [key: string]: any } = {
    Briefcase,
    Dumbbell,
    Sparkles,
    Heart,
    Moon,
    Brain,
    Zap,
    Wind,
    Salad,
    CloudMoon,
    Crown,
    BookOpen,
    Podcast,
    FileText,
    Check,
    Plus,
    Trash2,
    HelpCircle,
    Trophy,
    Play,
    Pause,
    X,
    Lock,
    ChevronRight,
    Sparkle
  };

  const Component = icons[name] || HelpCircle;
  return <Component className={className} size={size} />;
}
