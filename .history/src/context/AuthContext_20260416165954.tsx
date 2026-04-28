import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const [role, setRole] = useState<string | null>(null);

useEffect(() => {
  const unsub = onAuthStateChanged(auth, async (currentUser) => {
    setUser(currentUser);

    if (currentUser) {
      const ref = doc(db, "users", currentUser.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setRole(snap.data().role);
      } else {
        setRole(null);
      }
    } else {
      setRole(null);
    }

    setLoading(false);
  });

  return () => unsub();
}, []);

return (
  <AuthContext.Provider value={{ user, role, loading }}>
    {children}
  </AuthContext.Provider>
);