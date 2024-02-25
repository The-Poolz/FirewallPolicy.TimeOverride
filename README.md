# FirewallPolicy.LockDealProvider.LockTimeOverride

## Installation

**Install the packages:**

```console
npm i
```

**Compile contracts:**

```console
npx hardhat compile
```

**Run tests:**

```console
npx hardhat test
```

**Run coverage:**

```console
npx hardhat coverage
```

**Deploy:**

```console
truffle dashboard
```

```console
npx hardhat run ./scripts/deploy.ts --network truffleDashboard
```

## description

This repository utilizes `FirewallPolicyBase` to define a policy that extends the locking time for the lock deal provider. Specifically, it transitions from an invalid timestamp to a valid timestamp for a designated vault ID.
