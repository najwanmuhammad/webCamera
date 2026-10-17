import { PwaStatus } from '@/features/pwa/PwaStatus';
import { CameraScreen } from '@/features/camera/components/CameraScreen';
import { PhotoEditor } from '@/features/editor/components/PhotoEditor';
import { usePhotoStore } from '@/features/editor/store/photo-store';
export default function App() {
  const photo = usePhotoStore((state) => state.photo);
  return (
    <main className="app-shell" aria-label="GeoStamp Camera">
      {photo ? <PhotoEditor photo={photo} /> : <CameraScreen />}
      <PwaStatus />
    </main>
  );
}
