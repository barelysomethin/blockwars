'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';

// Grid Configuration
const GRID_SIZE = 15;
const COOLDOWN_MS = 2000; // 2 second cooldown

// Vibrant Neobrutalist Orange Palette
const COLORS = [
  '#FF3D00', // Deep Orange
  '#FF5E00', // Primary Orange
  '#FF7A00', // Bright Orange
  '#FF8A45', // Light Orange
  '#E65C00', // Burnt Orange
  '#FF9D00', // Yellow Orange
];

interface Block {
  id: string;
  owner: string;
  color: string;
}

export default function Home() {
  const [userId, setUserId] = useState<string>('');
  const [userColor, setUserColor] = useState<string>('');
  const [blocks, setBlocks] = useState<Record<string, Block>>({});
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  
  // Bonus Features State
  const [onCooldown, setOnCooldown] = useState(false);
  const [claimingIds, setClaimingIds] = useState<Set<string>>(new Set());

  // Initialize User
  useEffect(() => {
    let storedId = localStorage.getItem('grid_user_id');
    let storedColor = localStorage.getItem('grid_user_color');

    if (!storedId) {
      storedId = `USER-${uuidv4().substring(0, 4).toUpperCase()}`;
      localStorage.setItem('grid_user_id', storedId);
    }
    
    if (!storedColor) {
      storedColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      localStorage.setItem('grid_user_color', storedColor);
    }

    setUserId(storedId);
    setUserColor(storedColor);
  }, []);

  // Fetch initial grid and subscribe to real-time changes
  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        const { data, error } = await supabase.from('blocks').select('*');
        if (error) throw error;

        if (isMounted && data) {
          const blocksMap: Record<string, Block> = {};
          data.forEach((item) => {
            blocksMap[item.id] = item as Block;
          });
          setBlocks(blocksMap);
        }
      } catch (error) {
        console.error('Error fetching initial grid:', error);
      }
    };

    fetchInitialData();

    // Subscribe to Realtime updates
    const channel = supabase
      .channel('public:blocks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'blocks' },
        (payload) => {
          const newBlock = payload.new as Block;
          setBlocks((prev) => ({
            ...prev,
            [newBlock.id]: newBlock,
          }));
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setConnectionStatus('error');
        }
      });

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Calculate Leaderboard (Top 5 users by block count)
  const leaderboard = useMemo(() => {
    const counts: Record<string, { count: number, color: string }> = {};
    Object.values(blocks).forEach(block => {
      if (!counts[block.owner]) {
        counts[block.owner] = { count: 0, color: block.color };
      }
      counts[block.owner].count += 1;
    });

    return Object.entries(counts)
      .map(([owner, data]) => ({ owner, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [blocks]);

  // Handle clicking a block
  const handleClaimBlock = useCallback(async (x: number, y: number) => {
    if (!userId || !userColor) return;
    if (onCooldown) return; // Prevent clicking if on cooldown
    
    const blockId = `${x}-${y}`;
    const existingBlock = blocks[blockId];

    // Can't claim your own block again instantly
    if (existingBlock && existingBlock.owner === userId) return;

    // Trigger Cooldown
    setOnCooldown(true);
    setTimeout(() => setOnCooldown(false), COOLDOWN_MS);

    // Optimistic UI Update & visual claiming state
    setClaimingIds((prev) => new Set(prev).add(blockId));
    
    // Save to DB
    try {
      const { error } = await supabase
        .from('blocks')
        .upsert({ 
          id: blockId, 
          owner: userId, 
          color: userColor 
        });

      if (error) throw error;
    } catch (err) {
      console.error('Failed to claim block:', err);
    } finally {
      setClaimingIds((prev) => {
        const next = new Set(prev);
        next.delete(blockId);
        return next;
      });
    }
  }, [userId, userColor, blocks, onCooldown]);

  // Generate grid cells
  const gridCells = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const id = `${x}-${y}`;
      const block = blocks[id];
      const isClaiming = claimingIds.has(id);
      
      gridCells.push(
        <div
          key={id}
          onClick={() => handleClaimBlock(x, y)}
          className={`block ${onCooldown ? 'on-cooldown' : ''}`}
          style={{
            backgroundColor: block ? block.color : undefined,
            opacity: isClaiming ? 0.7 : 1
          }}
          title={block ? `Owned by ${block.owner}` : 'Unclaimed'}
        >
          {block && <span className="block-text">{block.owner}</span>}
        </div>
      );
    }
  }

  return (
    <div className="container">
      <header>
        <h1>Block Wars</h1>
      </header>

      {userId && (
        <div className="panel user-panel">
          <div className="color-indicator" style={{ backgroundColor: userColor }} />
          <span>Player: <span className="user-id">{userId}</span></span>
        </div>
      )}

      <div className="main-content">
        {/* The Grid Canvas */}
        <main className="grid-container">
          <div 
            className="grid" 
            style={{ 
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)` 
            }}
          >
            {gridCells}
          </div>
        </main>

        {/* Bonus Feature: Leaderboard */}
        <aside className="panel leaderboard">
          <h2>Leaderboard</h2>
          {leaderboard.length === 0 ? (
            <p>No blocks claimed yet.</p>
          ) : (
            leaderboard.map((user, index) => (
              <div key={user.owner} className="leader-item">
                <div className="leader-name">
                  <span className="leader-color" style={{ backgroundColor: user.color }} />
                  {index + 1}. {user.owner === userId ? '(You)' : user.owner}
                </div>
                <div className="leader-score">{user.count}</div>
              </div>
            ))
          )}
        </aside>
      </div>

      {/* Bonus Feature: Cooldown Indicator */}
      {onCooldown && (
        <div className="cooldown-overlay">
          RECHARGING...
        </div>
      )}

      <div className={`panel status-badge status-${connectionStatus}`}>
        <div className="status-dot" />
        {connectionStatus === 'connected' ? 'Connected' : 
         connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
      </div>
    </div>
  );
}
