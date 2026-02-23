import { Button } from "@/components/ui/button";
import { Building2, Shield, ClipboardCheck, Bot, ArrowRight, FileText, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const features = [
  {
    icon: ClipboardCheck,
    title: "Controle de Obrigações",
    desc: "Alertas automáticos para dedetização, AVCB, limpeza de caixa d'água e todas as obrigações periódicas.",
  },
  {
    icon: FileText,
    title: "Gestão de Documentos",
    desc: "Centralize atas, apólices e contratos. Upload direto ou link do Google Drive.",
  },
  {
    icon: Users,
    title: "Equipe Operacional",
    desc: "Zeladores fazem check-in de tarefas pelo celular, com fotos e registro de execução.",
  },
  {
    icon: Bot,
    title: "Assistente IA",
    desc: "Consulte dados, crie tarefas e gere relatórios usando linguagem natural.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

const Landing = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <Building2 className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold tracking-tight">SíndicoOS</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link to="/login">Entrar</Link>
          </Button>
          <Button asChild>
            <Link to="/register">Começar grátis</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 pt-20 pb-32 max-w-7xl mx-auto text-center gradient-hero">
        {/* Glow orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full glow-orange pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8">
            <Shield className="h-4 w-4" />
            Plataforma para síndicos profissionais
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
            Gerencie seus
            <br />
            <span className="text-primary">condomínios</span> com
            <br />
            inteligência
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Obrigações, documentos, tarefas e assistente IA — tudo em uma única
            plataforma para quem administra múltiplos condomínios.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="text-base px-8 h-12">
              <Link to="/register">
                Começar agora <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-8 h-12">
              <Link to="/login">Já tenho conta</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-6 py-24 max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-center mb-16"
        >
          Tudo que você precisa para{" "}
          <span className="text-primary">administrar</span>
        </motion.h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="p-6 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 max-w-3xl mx-auto text-center">
        <div className="p-12 rounded-2xl border border-primary/20 bg-primary/5">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para simplificar sua gestão?
          </h2>
          <p className="text-muted-foreground mb-8">
            Cadastre-se gratuitamente e comece a organizar seus condomínios hoje.
          </p>
          <Button size="lg" asChild className="text-base px-8 h-12">
            <Link to="/register">
              Criar minha conta <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8 max-w-7xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <span>SíndicoOS</span>
        </div>
        <span>© 2026 SíndicoOS. Todos os direitos reservados.</span>
      </footer>
    </div>
  );
};

export default Landing;
