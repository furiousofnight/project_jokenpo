import random
from time import sleep

itens = ("pedra", "papel", "tesoura")

def jogada_computador(ultimo):
    pesos = [1.0, 1.0, 1.0]
    if ultimo is not None:
        pesos[ultimo] = 0.3
    return random.choices([0, 1, 2], weights=pesos, k=1)[0]

ultimo_computador = None

while True:
    computador = jogada_computador(ultimo_computador)
    ultimo_computador = computador

    print("\nSUAS OPÇÕES:")
    print("[0] PEDRA\n[1] PAPEL\n[2] TESOURA")

    try:
        jogador = int(input("Qual é sua jogada?: "))
        if jogador not in [0, 1, 2]:
            raise ValueError

        print("\nJO")
        sleep(1)
        print("KEN")
        sleep(1)
        print("PÔ!!!\n")
        sleep(1)

        print("=*=" * 20)
        print(" "*15, f"O computador jogou {itens[computador]}.", " "*7)
        print(" "*3,"=*="*8,"&","=*="*8)
        print(" "*16, f"O jogador jogou {itens[jogador]}.", " "*7)
        print("=*=" * 20)

        if computador == jogador:
            print("EMPATE!")
        elif (computador == 0 and jogador == 2) or \
             (computador == 1 and jogador == 0) or \
             (computador == 2 and jogador == 1):
            print("O COMPUTADOR GANHOU!")
        else:
            print("O JOGADOR GANHOU!")

    except ValueError:
        print("⚠️ Jogada inválida! Digite 0, 1 ou 2.")
        continue

    repetir = input("\nDeseja jogar novamente? [S/N]: ").strip().upper()
    if repetir != "S":
        print("Obrigado por jogar. Até logo!")
        break
