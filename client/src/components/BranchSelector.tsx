import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../utils/cn';

const DEFAULT_BRANCHES = ['main', 'master', 'develop'];

interface BranchSelectorProps {
    branch: string;
    setBranch: (branch: string) => void;
    className?: string;
}

export default function BranchSelector({ branch, setBranch, className }: BranchSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSelect = (selectedBranch: string) => {
        setBranch(selectedBranch);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Branch"
                    className={cn("input w-36 pr-8", className)}
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                />
                <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-dark-muted hover:text-white transition-colors"
                    onClick={() => {
                        setIsOpen(!isOpen);
                        if (!isOpen && inputRef.current) {
                            inputRef.current.focus();
                        }
                    }}
                >
                    <ChevronDown size={14} className={cn("transition-transform", isOpen && "rotate-180")} />
                </button>
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-dark-card border border-dark-border rounded shadow-lg z-50 overflow-hidden">
                    <div className="p-2">
                        <div className="text-xs font-semibold text-dark-muted px-2 py-1 mb-1">SUGGESTIONS</div>
                        {DEFAULT_BRANCHES.map(b => (
                            <button
                                key={b}
                                type="button"
                                className={cn(
                                    "w-full text-left px-2 py-1.5 text-sm rounded flex items-center justify-between hover:bg-dark-border transition-colors",
                                    branch === b ? "text-primary bg-dark-border/50" : "text-dark-text"
                                )}
                                onClick={() => handleSelect(b)}
                            >
                                <span>{b}</span>
                                {branch === b && <Check size={14} />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
