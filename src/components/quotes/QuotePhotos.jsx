import db from '@/api/base44Client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Trash2 } from 'lucide-react';

export default function QuotePhotos({ quote, onUpdate }) {
  const [localPhotos, setLocalPhotos] = useState(quote.photos || []);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setLocalPhotos(quote.photos || []);
  }, [quote.photos]);

  const handleUpload = async (label) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      const { file_url } = await db.integrations.Core.UploadFile({ file, maxSize: 1024, square: false, quality: 0.85 });
      const next = [...localPhotos, { url: file_url, label, note: '' }];
      setLocalPhotos(next);
      onUpdate(next);
      setUploading(false);
    };
    input.click();
  };

  const removePhoto = (idx) => {
    const next = localPhotos.filter((_, i) => i !== idx);
    setLocalPhotos(next);
    onUpdate(next);
  };

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3">Before/After Photos</h3>
      <div className="flex gap-2 mb-3">
        <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => handleUpload('before')} disabled={uploading}>
          <Camera className="w-4 h-4" /> Before
        </Button>
        <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => handleUpload('after')} disabled={uploading}>
          <Camera className="w-4 h-4" /> After
        </Button>
      </div>
      {uploading && <p className="text-xs text-muted-foreground mb-2">Uploading...</p>}
      <div className="grid grid-cols-2 gap-2">
        {localPhotos.map((photo, idx) => (
          <Card key={idx} className="relative overflow-hidden">
            <img src={photo.url} alt="" className="w-full h-32 object-cover" />
            <Badge className="absolute top-2 left-2 text-[10px]">
              {photo.label === 'before' ? '📸 Before' : '✨ After'}
            </Badge>
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6"
              onClick={() => removePhoto(idx)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
