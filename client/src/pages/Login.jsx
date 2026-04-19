import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { assets } from "../assets/assets";
import { SignIn } from "@clerk/clerk-react";

const Login = () => {
  return (
    <div className="relative min-h-screen flex flex-col md:flex-row ">

      <img
        src={assets.bgImage}
        alt=""
        className="absolute inset-0 -z-10 w-full h-full object-cover"

      />

      <div className="flex-1 flex flex-col items-start justify-between lg:pl-40 p-6 md:p-10 z">
        {/* اللوغو */}
        <motion.img
          src={assets.logo}
          alt=""
          className="h-12 object-contain "
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        />

        {/* users + stars */}
        <div className="flex items-center gap-3 mb-4 max-md:mt-10">
          <img src={assets.group_users} alt="" className="h-8 md:h-10" />

          <div>
            <div className="flex">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <Star
                    key={i}
                    className="size-4 md:size-4.5 text-transparent fill-amber-500"
                  />
                ))}
            </div>

            <p className="text-gray-300 text-sm mt-1">
              Used by 12k+ developers
            </p>
          </div>
        </div>

        {/* العنوان */}
        <motion.h1
          className="text-3xl md:text-6xl md:pb-2 font-bold
                     bg-linear-to-r from-indigo-950 to-indigo-800
                     bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          More than just friends truly connect
        </motion.h1>

        {/* وصف بسيط تحت العنوان (اختياري) */}
        <motion.p
          className="text-white/80 mt-4 max-w-xl text-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          Meet people who match your vibe, share real moments,
          and turn conversations into lasting connections.
        </motion.p>
      </div>
     <div className="flex-1 flex items-center justify-center p-6 md:p-10 z-10">
  <motion.div
    className="w-full max-w-md p-8 rounded-3xl
               bg-transparent backdrop-blur-3xl
               shadow-[0_0_30px_rgba(0,0,0,0.4)]
               border border-white/10"
    initial={{ opacity: 0, scale: 0.9, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ duration: 0.9 }}
  >

    <SignIn
      appearance={{
        baseTheme: "dark",
        variables: {
          colorPrimary: "#2563eb",
          colorText: "#ffffff", 
          colorBackground: "transparent",
          colorInputBackground: "rgba(15,23,42,0.8)",
          colorCardBackground: "rgba(15,23,42,0.9)",
        },

        elements: {
          card:
            "rounded-3xl border border-white/10 shadow-[0_0_25px_rgba(15,23,42,0.8)]",

          headerTitle:
            "text-2xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]",

          headerSubtitle:
            "text-gray-200 drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]",

          socialButtonsBlockButton:
            "bg-slate-800 text-white rounded-xl hover:scale-105 transition-all drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]",

          formFieldInput:
            "bg-slate-900/80 border border-slate-600/60 rounded-xl text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] placeholder-gray-400 focus:ring-2 focus:ring-indigo-500",

          formButtonPrimary:
            "bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 rounded-xl drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]",

          footerActionLink:
            "text-indigo-300 hover:text-indigo-200 drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]",
        },
      }}
    />

  </motion.div>
</div>




      <span className="md:h-10"></span>
    </div>
  );
};

export default Login;
