import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { $ontologyRid, $Objects } from "@osdk-foo/sdk";
import { Ontologies } from "@osdk/foundry";
import { client } from "../../client";
import styles from "./CommandPalette.module.scss";

interface ObjectTypeOption {
  value: string;
  label: string;
  description?: string;
}

interface ObjectInstanceOption {
  value: string;
  label: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectObject: (objectType: ObjectTypeOption, object: ObjectInstanceOption) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onSelectObject }) => {
  const [step, setStep] = useState<'objectType' | 'object'>('objectType');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedObjectType, setSelectedObjectType] = useState<ObjectTypeOption | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Fetch all object types
  const { data: allObjectTypes = [] } = useQuery({
    queryKey: ['objectTypes', $ontologyRid],
    queryFn: async () => {
      const response = await Ontologies.ObjectTypesV2.list(client, $ontologyRid);
      return response.data.map(objectType => ({
        value: objectType.apiName,
        label: objectType.displayName,
        description: objectType.description,
      }));
    },
  });

  // Filter object types based on search
  const filteredObjectTypes = allObjectTypes.filter(ot =>
    ot.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ot.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fetch objects for selected type
  const { data: objectInstances = [], isLoading: loadingObjects } = useQuery({
    queryKey: ['objects', selectedObjectType?.value, searchQuery],
    queryFn: async () => {
      if (!selectedObjectType) return [];

      const objectTypeDef = ($Objects as any)[selectedObjectType.value];
      if (!objectTypeDef) return [];

      const response = await client(objectTypeDef).fetchPage({ $pageSize: 10 });
      return response.data.map((obj: any) => ({
        value: obj.$primaryKey,
        label: obj.title || obj.$primaryKey,
      }));
    },
    enabled: !!selectedObjectType && step === 'object',
  });

  // Filter objects based on search
  const filteredObjects = objectInstances.filter(obj =>
    obj.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentResults = step === 'objectType' ? filteredObjectTypes : filteredObjects;

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setStep('objectType');
      setSearchQuery('');
      setSelectedObjectType(null);
      setHighlightedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex(prev => Math.min(prev + 1, currentResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (currentResults[highlightedIndex]) {
          handleSelect(currentResults[highlightedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, highlightedIndex, currentResults, step]);

  // Reset highlighted index when search changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const handleSelect = (item: ObjectTypeOption | ObjectInstanceOption) => {
    if (step === 'objectType') {
      setSelectedObjectType(item as ObjectTypeOption);
      setStep('object');
      setSearchQuery('');
    } else {
      // Selected an object
      if (selectedObjectType) {
        onSelectObject(selectedObjectType, item as ObjectInstanceOption);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.commandPalette} ref={overlayRef}>
        <div className={styles.header}>
          <span className={styles.prompt}>
            {step === 'objectType' ? 'Select Object Type' : `Select ${selectedObjectType?.label}`}
          </span>
        </div>

        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={step === 'objectType' ? 'Search object types...' : 'Search objects...'}
        />

        <div className={styles.results}>
          {loadingObjects && step === 'object' ? (
            <div className={styles.loading}>Loading objects...</div>
          ) : currentResults.length === 0 ? (
            <div className={styles.empty}>No results found</div>
          ) : (
            currentResults.map((item, index) => {
              const itemWithDesc = item as ObjectTypeOption;
              const hasDescription = itemWithDesc.description;
              return (
                <div
                  key={item.value}
                  className={`${styles.resultItem} ${index === highlightedIndex ? styles.highlighted : ''}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className={styles.resultLabel}>{item.label}</div>
                  {hasDescription && (
                    <div className={styles.resultDescription}>{itemWithDesc.description}</div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className={styles.footer}>
          <span>{'↑↓ Navigate'}</span>
          <span>{'↵ Select'}</span>
          <span>{'Esc Close'}</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
