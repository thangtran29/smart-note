import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createHash, randomBytes } from 'crypto';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: noteId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify note ownership first
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('id')
      .eq('id', noteId)
      .eq('user_id', user.id)
      .single();

    if (noteError || !note) {
      // Don't reveal if note doesn't exist or user doesn't own it
      return NextResponse.json(
        { error: 'Unable to unlock content' },
        { status: 404 }
      );
    }

    // Fetch variants (RLS will enforce ownership)
    const { data: variants, error: variantsError } = await supabase
      .from('note_encryption_variants')
      .select('*')
      .eq('note_id', noteId)
      .order('created_at', { ascending: true });

    if (variantsError) {
      console.error('Error fetching variants:', variantsError);
      return NextResponse.json(
        { error: 'Unable to unlock content' },
        { status: 500 }
      );
    }

    // Convert BYTEA fields (salt, iv) to hex strings
    // Supabase returns BYTEA as hex strings with \x prefix, or sometimes as base64
    const formattedVariants = (variants || []).map((v: any) => {
      // Handle salt: remove \x prefix if present, or convert from base64
      let saltHex = v.salt;
      if (typeof saltHex === 'string') {
        if (saltHex.startsWith('\\x')) {
          saltHex = saltHex.substring(2); // Remove \x prefix
        } else if (saltHex.length > 32) {
          // Likely base64, convert to hex
          const binary = atob(saltHex);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          saltHex = Array.from(bytes)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
        }
      }
      
      // Handle iv: remove \x prefix if present, or convert from base64
      let ivHex = v.iv;
      if (typeof ivHex === 'string') {
        if (ivHex.startsWith('\\x')) {
          ivHex = ivHex.substring(2); // Remove \x prefix
        } else if (ivHex.length > 24) {
          // Likely base64, convert to hex
          const binary = atob(ivHex);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          ivHex = Array.from(bytes)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
        }
      }
      
      // Generate a secret token for this variant (hash of variant ID + server secret)
      // This doesn't reveal the variant count but can be used for verification
      const serverSecret = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'default-secret';
      const secretInput = `${v.id}-${v.created_at}-${serverSecret}`;
      const secret = createHash('sha256')
        .update(secretInput)
        .digest('hex')
        .substring(0, 32);
      
      return {
        id: v.id,
        note_id: v.note_id,
        encrypted_content: v.encrypted_content,
        salt: saltHex,
        iv: ivHex,
        kdf_type: v.kdf_type,
        kdf_iterations: v.kdf_iterations,
        kdf_hash: v.kdf_hash,
        created_at: v.created_at,
        secret: secret, // Secret token for this variant
        is_real: true, // Mark real variants - keep this for variant manager to identify real ones
      };
    });

    // Generate fake variants to hide the actual count
    // Return a random number of total variants between realCount and 20
    const realCount = formattedVariants.length;
    const MAX_TOTAL_VARIANTS = 20;
    const MIN_TOTAL_VARIANTS = realCount; // At least return all real variants
    
    // Random total between realCount and 20 (inclusive)
    const targetTotal = realCount < MAX_TOTAL_VARIANTS
      ? MIN_TOTAL_VARIANTS + Math.floor(Math.random() * (MAX_TOTAL_VARIANTS - MIN_TOTAL_VARIANTS + 1))
      : realCount; // If realCount >= 20, just return real variants
    
    const fakeCount = Math.max(0, targetTotal - realCount);

    // Helper function to generate UUID v4
    const generateUUID = () => {
      const bytes = randomBytes(16);
      bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
      bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10
      const hex = bytes.toString('hex');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
    };

    const fakeVariants: any[] = [];
    for (let i = 0; i < fakeCount; i++) {
      // Generate random data that looks like a real variant
      const fakeSalt = randomBytes(16).toString('hex'); // 32 hex chars
      const fakeIV = randomBytes(12).toString('hex'); // 24 hex chars
      
      // Generate random base64 encrypted content (similar length to real encrypted data)
      // Real encrypted content is typically 100-200 chars base64
      const fakeContentLength = 120 + Math.floor(Math.random() * 80);
      const fakeEncryptedContent = randomBytes(fakeContentLength).toString('base64');
      
      // Generate fake UUID v4
      const fakeId = generateUUID();
      
      // Generate fake timestamp (within last year)
      const fakeCreatedAt = new Date(
        Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
      ).toISOString();
      
      // Generate secret for fake variant
      const serverSecret = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'default-secret';
      const secretInput = `${fakeId}-${fakeCreatedAt}-${serverSecret}`;
      const secret = createHash('sha256')
        .update(secretInput)
        .digest('hex')
        .substring(0, 32);
      
      fakeVariants.push({
        id: fakeId,
        note_id: noteId,
        encrypted_content: fakeEncryptedContent,
        salt: fakeSalt,
        iv: fakeIV,
        kdf_type: 'pbkdf2',
        kdf_iterations: 300000 + Math.floor(Math.random() * 200000), // 300k-500k
        kdf_hash: 'SHA-256',
        created_at: fakeCreatedAt,
        secret: secret,
        is_real: false, // Mark fake variants (internal, will be removed before response)
      });
    }

    // Check if this is for variant manager (only real variants) or password dialog (all variants)
    const { searchParams } = new URL(request.url);
    const forManager = searchParams.get('for') === 'manager';

    if (forManager) {
      // For variant manager: return only real variants (no fake ones, no is_real flag)
      const responseVariants = formattedVariants.map(({ is_real, ...variant }) => variant);
      return NextResponse.json({ 
        success: true, 
        variants: responseVariants,
        realVariantCount: realCount
      });
    } else {
      // For password dialog: return all variants (real + fake) without is_real flag
      const allVariants = [...formattedVariants, ...fakeVariants];
      const shuffledVariants = allVariants.sort(() => Math.random() - 0.5);
      
      // Remove is_real flag - frontend should never know which are real/fake
      const responseVariants = shuffledVariants.map(({ is_real, ...variant }) => variant);

      return NextResponse.json({ 
        success: true, 
        variants: responseVariants,
        realVariantCount: realCount // Include real count for client-side checks
      });
    }
  } catch (error) {
    console.error('Get note variants error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

