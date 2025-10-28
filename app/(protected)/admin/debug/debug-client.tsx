'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, ChevronRight, ChevronDown, Database, Copy, Check, Play, ArrowLeft } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import Link from 'next/link';

interface CollectionSchema {
  name: string;
  fields: string[];
  sample: Record<string, unknown>[]; // Changed to array to store all records
  relationships?: string[];
}

interface DatabaseTree {
  collections: { [key: string]: CollectionSchema };
}

export default function DebugClient() {
  const [loading, setLoading] = useState(true);
  const [tree, setTree] = useState<DatabaseTree>({ collections: {} });
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const collections = [
    'User',
    'FormField',
    'PlaceTypeConfig',
    'ScoringConfig',
    'VisitData',
    'News',
    'Season',
    'Account',
    'VerificationToken',
    'PasswordResetToken',
    'TwoFactorToken',
    'TwoFactorConfirmation'
  ];

  useEffect(() => {
    loadDatabaseTree();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDatabaseTree = async () => {
    setLoading(true);
    const dbTree: DatabaseTree = { collections: {} };

    for (const collection of collections) {
      try {
        const response = await fetch(`/api/admin/${collection}?limit=100`);
        if (response.ok) {
          const json = await response.json();
          const records = json.data || json.records || [];
          
          dbTree.collections[collection] = {
            name: collection,
            fields: records.length > 0 ? Object.keys(records[0]) : [],
            sample: records, // Store all records instead of just the first one
            relationships: getRelationships(collection)
          };
        }
      } catch (error) {
        console.error(`Error loading ${collection}:`, error);
      }
    }

    setTree(dbTree);
    setLoading(false);
  };

  const getRelationships = (collection: string): string[] => {
    const relationships: { [key: string]: string[] } = {
      'User': ['Account', 'VisitData', 'TwoFactorConfirmation'],
      'VisitData': ['User', 'Season'],
      'Account': ['User'],
      'TwoFactorConfirmation': ['User'],
      'News': [],
      'Season': ['VisitData'],
      'FormField': [],
      'PlaceTypeConfig': [],
      'ScoringConfig': [],
      'VerificationToken': [],
      'PasswordResetToken': [],
      'TwoFactorToken': []
    };
    return relationships[collection] || [];
  };

  const toggleExpanded = (collection: string) => {
    setExpanded(prev => ({ ...prev, [collection]: !prev[collection] }));
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const generateAIMessage = (collection: string) => {
    const coll = tree.collections[collection];
    const records = Array.isArray(coll.sample) ? coll.sample : [coll.sample];
    const msg = `## ${collection} Schema\n\n**Fields:** ${coll.fields.join(', ')}\n\n**Records (${records.length}):**\n\`\`\`json\n${JSON.stringify(records, null, 2)}\n\`\`\`\n\n**Relationships:** ${coll.relationships?.join(' → ') || 'None'}`;
    copyToClipboard(msg, collection);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link 
            href="/admin" 
            className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Zpět na admin dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8" />
            Database Tree Structure
          </h1>
          <p className="text-muted-foreground mt-1">
            Interactive database schema visualization for AI agents
          </p>
        </div>
        <button
          onClick={loadDatabaseTree}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Play className="h-4 w-4" />
          Reload
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(tree.collections).map(([key, value]) => (
          <div key={key} className="bg-white border rounded-lg p-4">
            <div className="text-sm text-gray-500">{key}</div>
            <div className="text-2xl font-bold mt-1">{value.fields.length}</div>
            <div className="text-xs text-gray-400 mt-1">
              {value.sample && Array.isArray(value.sample) ? `${value.sample.length} records` : 'empty'}
            </div>
          </div>
        ))}
      </div>

      {/* Database Tree */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Collections</h2>
        {Object.entries(tree.collections).map(([key, collection]) => (
          <Collapsible key={key} open={expanded[key]} onOpenChange={() => toggleExpanded(key)}>
            <div className="bg-white border rounded-lg overflow-hidden">
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center gap-2">
                    {expanded[key] ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                    <span className="font-medium">{key}</span>
                    <span className="text-sm text-gray-500">
                      ({collection.fields.length} fields)
                    </span>
                  </div>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      generateAIMessage(key);
                    }}
                    className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === key ? (
                      <><Check className="h-3 w-3" /> Copied!</>
                    ) : (
                      <><Copy className="h-3 w-3" /> Copy for AI</>
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="border-t p-4 space-y-4">
                  {/* Fields */}
                  <div>
                    <h4 className="font-medium mb-2">Fields ({collection.fields.length}):</h4>
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {collection.fields.map(field => (
                        <div
                          key={field}
                          className="px-3 py-1.5 bg-gray-100 rounded text-sm font-mono border border-gray-200 cursor-pointer hover:bg-gray-200 flex items-center justify-between group"
                          onClick={() => copyToClipboard(field, `${key}.${field}`)}
                        >
                          <span className="truncate">{field}</span>
                          {copiedField === `${key}.${field}` && (
                            <Check className="h-3 w-3 text-green-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Relationships */}
                  {collection.relationships && collection.relationships.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Relationships:</h4>
                      <div className="flex flex-wrap gap-2">
                        {collection.relationships.map(rel => (
                          <span key={rel} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm">
                            → {rel}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sample Data */}
                  {collection.sample && Array.isArray(collection.sample) && collection.sample.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">All Records ({collection.sample.length}):</h4>
                      <div className="relative">
                        <pre className="text-xs overflow-auto bg-gray-50 p-4 rounded border border-gray-200 max-h-96">
                          {JSON.stringify(collection.sample, null, 2)}
                        </pre>
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(collection.sample, null, 2), `${key}.sample`)}
                          className="absolute top-2 right-2 px-2 py-1 bg-white border border-gray-300 rounded text-xs hover:bg-gray-50 flex items-center gap-1"
                        >
                          {copiedField === `${key}.sample` ? (
                            <><Check className="h-3 w-3" /> Copied</>
                          ) : (
                            <><Copy className="h-3 w-3" /> Copy</>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}
