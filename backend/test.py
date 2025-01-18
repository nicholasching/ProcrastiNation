from ai import Ai

roaster = Ai()
roaster.loadProfiles()

print(roaster.genIns(0,"Dylan",150,"Instagram", 0))