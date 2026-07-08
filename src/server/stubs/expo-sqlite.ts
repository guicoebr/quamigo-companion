// Stub para "expo-sqlite" — o build ESM do TypeORM importa esse pacote incondicionalmente
// (mesmo sem usarmos o driver Expo), e como não rodamos em React Native/Expo ele nunca é
// instalado de verdade. Sem este alias o bundle do servidor falha ao carregar com
// "Cannot find package 'expo-sqlite'" assim que qualquer código toca o TypeORM.
export default {};
