// Função para obter o Token de Acesso temporário do Spotify (expira em 1 hora)
async function getSpotifyAccessToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Credenciais do Spotify não configuradas no .env.local');
  }

  // codifica as credenciais em Base64 para a autenticação básica exigida pelo Spotify
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: 'grant_type=client_credentials',
    // cacheia a resposta por 50 minutos (3000 segundos) para não esgotar nosso limite de taxa
    next: { revalidate: 3000 }, 
  });

  if (!response.ok) {
    throw new Error('Falha ao obter token de acesso do Spotify');
  }

  const data = await response.json();
  return data.access_token;
}

export interface SpotifyAlbumSearchResult {
  id: string;
  title: string;
  artist_name: string;
  artist_id: string; 
  image_url: string;
  release_date: string;
  release_type: 'album' | 'single' | 'ep'; // 
}

// função pública para pesquisar álbuns no Spotify
export async function searchSpotifyAlbums(query: string): Promise<SpotifyAlbumSearchResult[]> {
  if (!query || query.trim() === '') return [];

  try {
    const token = await getSpotifyAccessToken();

    // faz a chamada de busca especificando o tipo "album"
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=6`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Erro na resposta da busca do Spotify:', response.statusText);
      return [];
    }

    const data = await response.json();

    // mapeia o JSON de retorno do Spotify para o formato simplificado que nosso app utiliza
    return data.albums.items.map((item: any) => ({
      id: item.id,
      title: item.name,
      artist_name: item.artists[0]?.name || 'Artista Desconhecido',
      artist_id: item.artists[0]?.id || '',
      image_url: item.images[0]?.url || 'https://placehold.co/300',
      release_date: item.release_date,
      // garante correspondência com o Enum do banco
      release_type: item.album_type === 'single' ? 'single' : 'album', 
    }));
  } catch (error) {
    console.error('Erro ao pesquisar álbuns:', error);
    return [];
  }
}

export interface SpotifyAlbumDetail {
  id: string;
  title: string;
  artist_name: string;
  artist_id: string; // ID do Spotify para o Artista
  image_url: string;
  release_date: string;
  release_type: 'album' | 'single' | 'ep';
}

export async function getSpotifyAlbum(id: string): Promise<SpotifyAlbumDetail | null> {
  try {
    const token = await getSpotifyAccessToken();
    const response = await fetch(`https://api.spotify.com/v1/albums/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) return null;

    const item = await response.json();
    return {
      id: item.id,
      title: item.name,
      artist_name: item.artists[0]?.name || 'Artista Desconhecido',
      artist_id: item.artists[0]?.id || '',
      image_url: item.images[0]?.url || 'https://placehold.co/300',
      release_date: item.release_date,
      // Garante correspondência com nosso Enum do PostgreSQL ('album', 'single', 'ep')
      release_type: item.album_type === 'single' ? 'single' : 'album',
    };
  } catch (error) {
    console.error('Erro ao obter detalhes do álbum:', error);
    return null;
  }
}