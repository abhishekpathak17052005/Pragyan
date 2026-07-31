import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { PasswordService } from "../services/password.service";

jest.mock("bcryptjs", () => ({
  __esModule: true,
  default: {
    compare: jest.fn(),
    hash: jest.fn(),
  },
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe("PasswordService.changePassword", () => {
  it("changes the password when the current password is correct", async () => {
    const service = new PasswordService();
    const mockedCompare = bcrypt.compare as jest.Mock;
    const mockedHash = bcrypt.hash as jest.Mock;
    const mockedFindUnique = prisma.user.findUnique as jest.Mock;
    const mockedUpdate = prisma.user.update as jest.Mock;

    mockedCompare.mockImplementation(async (plainPassword: string) => plainPassword === "Current123!");
    mockedHash.mockResolvedValue("hashed-new-password");
    mockedFindUnique.mockResolvedValue({ id: "user-1", password: "hashed-current-password" });
    mockedUpdate.mockResolvedValue({});

    await expect(service.changePassword("user-1", "Current123!", "NewPass@4xq"))
      .resolves.toEqual({ message: "Password changed successfully" });

    expect(mockedCompare).toHaveBeenCalledWith("Current123!", "hashed-current-password");
    expect(mockedHash).toHaveBeenCalledWith("NewPass@4xq", expect.any(Number));
    expect(mockedUpdate).toHaveBeenCalled();
  });
});
