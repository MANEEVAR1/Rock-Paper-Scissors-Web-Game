import random

options = ("rock", "paper", "scissors")
isRunning = True

while isRunning:
    compChoice = random.choice(options)
    userChoice = input("Enter your choice: ").lower()
    # print(userChoice.lower())
    while userChoice not in options:
        print("Invalid Choice")
        userChoice = input("Enter your choice: ").lower()
    print(f"Computer: {compChoice}")
    print(f"User: {userChoice}")
    if compChoice == userChoice:
        print("It's a tie!")
    elif compChoice.lower() == "rock" and userChoice.lower() == "paper":
        print("You win!")
    elif compChoice.lower() == "paper" and userChoice.lower() == "scissors":
        print("You win!")
    elif compChoice.lower() == "scissors" and userChoice.lower() == "rock":
        print("You win!")
    else:
        print("You lose!")
    while True:
        playAgain = input("Do you want to play again? (y/n): ")
        if playAgain.lower() not in ("y", "n"):
            print("Invalid Choice. Please choose 'y' or 'n'")
        elif playAgain.lower() == 'n':
            isRunning = False
            print("Thanks for playing!")
            break
        else:
            break

