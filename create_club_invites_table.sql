-- Create club_invites table for storing club invitations
CREATE TABLE IF NOT EXISTS club_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    invited_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invited_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(club_id, invited_user_id, status)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_club_invites_club_id ON club_invites(club_id);
CREATE INDEX IF NOT EXISTS idx_club_invites_invited_user_id ON club_invites(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_club_invites_status ON club_invites(status);
CREATE INDEX IF NOT EXISTS idx_club_invites_created_at ON club_invites(created_at);

-- Enable Row Level Security
ALTER TABLE club_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for club_invites
-- Users can view invites sent to them
CREATE POLICY "Users can view their own invites" ON club_invites
    FOR SELECT USING (auth.uid() = invited_user_id);

-- Club owners can view invites for their club
CREATE POLICY "Club owners can view club invites" ON club_invites
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clubs 
            WHERE clubs.id = club_invites.club_id 
            AND clubs.owner_id = auth.uid()
        )
    );

-- Club owners can create invites for their club
CREATE POLICY "Club owners can create invites" ON club_invites
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM clubs 
            WHERE clubs.id = club_invites.club_id 
            AND clubs.owner_id = auth.uid()
        )
        AND auth.uid() = invited_by_id
    );

-- Invited users can update their own invites (accept/reject)
CREATE POLICY "Users can update their own invites" ON club_invites
    FOR UPDATE USING (auth.uid() = invited_user_id);

-- Club owners can delete invites for their club
CREATE POLICY "Club owners can delete club invites" ON club_invites
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM clubs 
            WHERE clubs.id = club_invites.club_id 
            AND clubs.owner_id = auth.uid()
        )
    );

-- Enable realtime for club_invites table
ALTER PUBLICATION supabase_realtime ADD TABLE club_invites; 